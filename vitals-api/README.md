# Vitals Aggregator

A Node.js service that ingests high-frequency vital-sign data from MQTT, buffers and aggregates it in fixed intervals, and persists immutable, patient-owned vitals into a MySQL database.

This service is designed for environments where **devices are reused across patients**, and **patient assignment can change over time**. Vitals are always attributed to the patient assigned to a room *at the moment of insertion*.

---

## Core Principles

* **Vitals are immutable events** — once written, they are never updated.
* **Devices are transient** — vitals do not belong to devices.
* **Patients own vitals** — ownership is resolved at write time via room assignment.
* **Room-to-patient mapping is the single source of truth**.

---

## Architecture Overview

```
MQTT Broker
   ↓
Vitals Aggregator (Node.js)
   ├─ In-memory buffer (per room)
   ├─ Daily temp log files (3-day retention)
   └─ 15-minute aggregation job
           ↓
        MySQL Database
```

---

## Features

* MQTT subscription (`rsi/data`)
* Per-room buffering of raw vitals
* Filtering of invalid readings (e.g. HR = 0)
* 15-minute average aggregation
* Room → patient resolution at insert time
* Immutable inserts into `vitals` table
* Daily raw-data temp files with 3-day retention
* Designed to run as a long-lived service (PM2 compatible)

---

## Project Structure

```
vitals-ingestor/
├─ index.js        # Entry point
├─ config.js       # Configuration (MQTT, DB, intervals)
├─ mqtt.js         # MQTT ingestion
├─ buffer.js       # In-memory buffering
├─ aggregator.js   # Aggregation logic
├─ db.js           # Database access layer
├─ cleanup.js      # Temp file retention cleanup
├─ tmp/            # Daily temp log files
└─ package.json
```

---

## MQTT Payload Format

Expected JSON payload:

```json
{
  "device_id": "DEVICE_001",
  "room_id": "ROOM_A",
  "breath_rate": 19,
  "heart_rate": 78,
  "distance": 28.7,
  "presence": 1,
  "timestamp": 40107
}
```

Notes:

* MQTT timestamp is ignored
* MySQL `NOW()` is used as the authoritative timestamp
* `heart_rate <= 0` and `breath_rate <= 0` are excluded from averages

---

## Database Requirements

### Required Tables

#### 1. Patient Table (`pasien_v2`)

```sql
CREATE TABLE `pasien_v2` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `emr_no` VARCHAR(20) NOT NULL,
  `nama` VARCHAR(120) NOT NULL,
  `tgl_lahir` DATE DEFAULT NULL,
  `jk` ENUM('L','P') DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pasien_emr` (`emr_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

#### 2. Room–Device–Patient Mapping (`room_device`)

This table defines **who currently occupies a room and which device is installed**. It is the **single source of truth** for patient attribution.

```sql
CREATE TABLE `room_device` (
  `room_id` VARCHAR(50) NOT NULL,
  `device_id` VARCHAR(50) NOT NULL,
  `emr_no` VARCHAR(20) NOT NULL,
  `assigned_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`room_id`),
  KEY `idx_device_id` (`device_id`),
  KEY `idx_emr_no` (`emr_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

Rules:

* One room → one active patient
* Devices may move between rooms
* Updating this table changes future ownership only

---

#### 3. Vitals Table (`vitals`)

This table stores **aggregated, immutable vital events**.

```sql
CREATE TABLE `vitals` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `emr_no` VARCHAR(20) NOT NULL,
  `waktu` DATETIME NOT NULL,
  `heart_rate` INT DEFAULT NULL,
  `respirasi` INT DEFAULT NULL,
  `jarak_kasur_cm` INT DEFAULT NULL,
  `glukosa` INT DEFAULT NULL,
  `berat_badan_kg` DECIMAL(5,2) DEFAULT NULL,
  `sistolik` INT DEFAULT NULL,
  `diastolik` INT DEFAULT NULL,
  `fall_detected` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_emr_no` (`emr_no`),
  KEY `idx_waktu` (`waktu`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

Notes:

* Rows are **append-only**
* No UPDATE or DELETE in normal operation
* Historical vitals are never reassigned

Patient changes are handled **only** by updating `room_device`.

---

## Aggregation Logic

* Raw MQTT data arrives ~1 message/second
* Data is buffered in memory per `room_id`
* Every **15 minutes**:

  1. Average HR and RR per room
  2. Resolve current patient via `room_device`
  3. Insert a single row into `vitals`

If no patient is assigned, vitals are stored with `emr_no = 'UNASSIGNED'`.

---

## Temp File Retention

* Raw MQTT data is appended to daily files:

  ```
  tmp/vitals-YYYY-MM-DD.log
  ```
* Files are retained for **3 days**
* Cleanup runs automatically once per hour

These files are intended for **audit and debugging**, not as primary storage.

---

## Installation

```bash
npm install
```

---

## Running the Service

### Development

```bash
node index.js
```

### Production (recommended)

```bash
pm2 start index.js --name vitals-ingestor
pm2 save
```

---

## Configuration

Edit `config.js`:

```js
{
  mqtt: {
    url: 'mqtt://<broker>:1883',
    topic: 'rsi/data',
    username: 'USER',
    password: 'PASS'
  },
  db: {
    host: 'localhost',
    user: 'dbuser',
    password: 'dbpass',
    database: 'dbname'
  },
  aggregationIntervalMs: 15 * 60 * 1000,
  fallbackEmr: 'UNASSIGNED'
}
```

---

## Operational Notes

* Do **not** run multiple instances (will cause duplicate inserts)
* Do **not** update existing rows in `vitals`
* Patient reassignment must occur **before** the next aggregation window
* Loss of up to one aggregation window is acceptable on crash

---

## Non-Goals

This service intentionally does **not**:

* Perform real-time visualization
* Rewrite historical data
* Bind vitals to devices
* Handle long-term raw data storage

---

## License / Usage

Internal service. No warranty. Use responsibly.

---

## Author Notes

This service is designed to be boring, predictable, and correct.
If you find yourself wanting to "just update old vitals", you are about to break it.
