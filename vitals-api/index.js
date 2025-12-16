const mqtt = require('./mqtt');
const aggregator = require('./aggregator');
const cleanup = require('./cleanup');
const config = require('./config');
const fs = require('fs');

mqtt.start();

setInterval(() => {
  aggregator.flush().catch(err =>
    console.error('Aggregation error:', err)
  );
}, config.aggregationIntervalMs);

// run cleanup once per hour (cheap + safe)
setInterval(() => {
  cleanup.cleanupTempFiles();
}, 60 * 60 * 1000);

setInterval(() => {
  fs.writeFileSync(
    'health.txt',
    new Date().toISOString()
  );
}, 60 * 1000);

console.log('Vitals ingestor running');
