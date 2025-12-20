const mqtt = require('mqtt');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const buffer = require('./buffer');
const minuteBuffer = require('./minuteBuffer');
const fallDetection = require('./fallDetection');

const TMP_DIR = path.join(__dirname, 'tmp');

function getTodayFile() {
  const date = new Date().toISOString().slice(0, 10);
  return path.join(TMP_DIR, `vitals-${date}.log`);
}

function getFallLogFile() {
  const date = new Date().toISOString().slice(0, 10);
  return path.join(TMP_DIR, `fall-${date}.log`);
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
        // Existing vitals data
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