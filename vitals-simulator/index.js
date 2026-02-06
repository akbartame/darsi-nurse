const mqtt = require('mqtt');
const config = require('./config');

const client = mqtt.connect(config.mqtt.host, {
  port: config.mqtt.port,
  username: config.mqtt.username,
  password: config.mqtt.password
});

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

client.on('connect', () => {
  console.log('[SIM] Connected to MQTT broker');

  setInterval(() => {
    config.rooms.forEach(room => {
      const hr = Math.round(rand(room.baseHr - 5, room.baseHr + 5));
      const rr = Math.round(rand(room.baseRr - 3, room.baseRr + 3));
      const distance = Math.round(rand(40, 120));

      // ---- rsi/data ----
      client.publish(
        'rsi/data',
        JSON.stringify({
          device_id: room.deviceId,
          room_id: room.roomId,
          heart_rate: hr,
          breath_rate: rr,
          distance,
          presence: 1
        })
      );

      // ---- hitam (presence / fall) ----
      let status = 'PEOPLE';

 
      client.publish(
        'hitam',
        JSON.stringify({
          telemetry: true,
          room_id: room.roomId, // simulate mismatch
          nilai_sensor: 1,
          status,
          lux: rand(5, 15),
          threshold: 0.6,
          rssi: -60
        })
      );
    });
  }, config.intervalMs);
});
