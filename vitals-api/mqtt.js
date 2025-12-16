const mqtt = require('mqtt');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const buffer = require('./buffer');

const TMP_DIR = path.join(__dirname, 'tmp');

function getTodayFile() {
  const date = new Date().toISOString().slice(0, 10);
  return path.join(TMP_DIR, `vitals-${date}.log`);
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
    client.subscribe(config.mqtt.topic);
    console.log('MQTT connected');
  });

  client.on('offline', () => {
    console.error('MQTT offline');
  });

  client.on('error', err => {
    console.error('MQTT error', err);
  });


  client.on('message', (_, message) => {
    try {
      const data = JSON.parse(message.toString());

      buffer.add(
        data.room_id,
        data.heart_rate,
        data.breath_rate
      );

      fs.appendFileSync(
        getTodayFile(),
        JSON.stringify(data) + '\n'
      );

    } catch (err) {
      console.error('Invalid MQTT payload', err);
    }
  });
}

module.exports = { start };
