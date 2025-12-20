const mqtt = require('mqtt');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const buffer = require('./buffer');
const minuteBuffer = require('./minuteBuffer');
const fallDetection = require('./fallDetection');

const TMP_DIR = path.join(__dirname, 'tmp');

// ---- HA publish control ----
const discoveredDevices = new Set();
const HA_TOPIC_VERSION = 'v1';
const HA_PUBLISH_INTERVAL_MS = 60 * 1000; // 1 minute (change later)
const haLastPublish = {}; // device_id -> timestamp


function getTodayFile() {
  const date = new Date().toISOString().slice(0, 10);
  return path.join(TMP_DIR, `vitals-${date}.log`);
}

function getFallLogFile() {
  const date = new Date().toISOString().slice(0, 10);
  return path.join(TMP_DIR, `fall-${date}.log`);
}

function publishHADiscovery(client, deviceId) {
  if (discoveredDevices.has(deviceId)) return;

  discoveredDevices.add(deviceId);

  const baseStateTopic = `rsi/v1/device/${deviceId}/state`;
  const devicePayload = {
    identifiers: [deviceId],
    name: `RSI mmWave ${deviceId}`,
    manufacturer: 'MEDLOC',
    model: 'Vital Sensor'
  };

  const sensors = [
    {
      component: 'sensor',
      objectId: 'breath_rate',
      payload: {
        name: 'Breath Rate',
        unit_of_measurement: 'bpm',
        value_template: '{{ value_json.breath_rate }}'
      }
    },
    {
      component: 'sensor',
      objectId: 'heart_rate',
      payload: {
        name: 'Heart Rate',
        unit_of_measurement: 'bpm',
        value_template: '{{ value_json.heart_rate }}'
      }
    },
    {
      component: 'sensor',
      objectId: 'distance',
      payload: {
        name: 'Distance',
        unit_of_measurement: 'cm',
        value_template: '{{ value_json.distance }}'
      }
    },
    {
      component: 'binary_sensor',
      objectId: 'presence',
      payload: {
        name: 'Presence',
        device_class: 'occupancy',
        payload_on: '1',
        payload_off: '0',
        value_template: '{{ value_json.presence }}'
      }
    }
  ];

  sensors.forEach(({ component, objectId, payload }) => {
    const topic = `homeassistant/${component}/${deviceId}/${objectId}/config`;

    client.publish(
      topic,
      JSON.stringify({
        ...payload,
        state_topic: baseStateTopic,
        unique_id: `${deviceId}_${objectId}`,
        device: devicePayload
      }),
      { retain: true }
    );
  });
}

function republishForHomeAssistant(client, data) {
  if (!data || !data.device_id) return;

  const now = Date.now();
  const last = haLastPublish[data.device_id] || 0;

  // Rate limiting (per device)
  if (now - last < HA_PUBLISH_INTERVAL_MS) {
    return;
  }

  haLastPublish[data.device_id] = now;

  const topic = `rsi/${HA_TOPIC_VERSION}/device/${data.device_id}/state`;

  client.publish(
    topic,
    JSON.stringify({
      device_id: data.device_id,
      room_id: data.room_id,
      breath_rate: data.breath_rate,
      heart_rate: data.heart_rate,
      distance: data.distance,
      presence: data.presence,
      timestamp: data.timestamp
    }),
    { retain: true }
  );
}


function start() {
  if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR);
  }

  const client = mqtt.connect(config.mqtt.url, {
    username: config.mqtt.username,
    password: config.mqtt.password
  });

  client.on('connect', () => {
    // Subscribe to both topics
    config.mqtt.topics.forEach(topic => {
      client.subscribe(topic);
      console.log(`MQTT subscribed to: ${topic}`);
    });
    console.log('MQTT connected');
  });

  client.on('offline', () => {
    console.error('MQTT offline');
  });

  client.on('error', err => {
    console.error('MQTT error', err);
  });

  client.on('message', (topic, message) => {
    try {
      const data = JSON.parse(message.toString());

      if (topic === 'rsi/data') {

        // auto-discover for Home Assistant
        publishHADiscovery(client, data.device_id);
        
        // republish to Home Assistant
        republishForHomeAssistant(client, data);

        // Vital signs data
        buffer.add(
          data.room_id,
          data.heart_rate,
          data.breath_rate,
          data.distance
        );

        minuteBuffer.add(
          data.room_id,
          data.heart_rate,
          data.breath_rate,
          data.distance
        );

        fs.appendFileSync(
          getTodayFile(),
          JSON.stringify(data) + '\n'
        );
      } 
      else if (topic === 'hitam') {
        // Fall detection data
        fallDetection.updateFallStatus(data.room_id, data.status);
        
        fs.appendFileSync(
          getFallLogFile(),
          JSON.stringify(data) + '\n'
        );
      }

    } catch (err) {
      console.error('Invalid MQTT payload', err);
    }
  });
}

module.exports = { start };