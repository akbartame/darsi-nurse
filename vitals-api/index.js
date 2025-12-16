const mqtt = require('./mqtt');
const aggregator = require('./aggregator');
const cleanup = require('./cleanup');
const config = require('./config');
const fs = require('fs');
const minuteBuffer = require('./minuteBuffer');
const { writeMinuteSummary } = require('./minuteSummary');

mqtt.start();

setInterval(() => {
  aggregator.flush().catch(err =>
    console.error('Aggregation error:', err)
  );
}, config.aggregationIntervalMs);

setInterval(() => {
  const snapshot = minuteBuffer.consumeAndReset();
  writeMinuteSummary(snapshot);
}, 60 * 1000);

// run cleanup once per day
setInterval(() => {
  cleanup.cleanupTempFiles();
}, 24 * 60 * 60 * 1000);

setInterval(() => {
  fs.writeFileSync(
    'health.txt',
    new Date().toISOString()
  );
}, 60 * 1000);

console.log('Vitals ingestor running');
