const mysql = require('mysql2/promise');
const config = require('./config');

const pool = mysql.createPool({
  ...config.db,
  waitForConnections: true,
  connectionLimit: 10
});

async function getEmrByRoom(roomId) {
  const [rows] = await pool.execute(
    'SELECT emr_no FROM room_device WHERE room_id = ?',
    [roomId]
  );
  return rows.length ? rows[0].emr_no : null;
}

async function insertVitals(emrNo, hr, rr) {
  await pool.execute(
    `INSERT INTO vitals (emr_no, waktu, heart_rate, respirasi)
     VALUES (?, NOW(), ?, ?)`,
    [emrNo, hr, rr]
  );
}

module.exports = { getEmrByRoom, insertVitals };
