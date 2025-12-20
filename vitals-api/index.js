const mqtt = require('./mqtt');
const aggregator = require('./aggregator');
const cleanup = require('./cleanup');
const config = require('./config');
const fs = require('fs');
const minuteBuffer = require('./minuteBuffer');
const { writeMinuteSummary } = require('./minuteSummary');
const fallAggregator = require('./fallAggregator');

mqtt.start();

// Regular 15-minute aggregation
setInterval(() => {
  aggregator.flush().catch(err =>
    console.error('Aggregation error:', err)
  );
}, config.aggregationIntervalMs);

// Minute summary
setInterval(() => {
  const snapshot = minuteBuffer.consumeAndReset();
  writeMinuteSummary(snapshot);
}, 60 * 1000);

// Fall detection check every minute
setInterval(() => {
  fallAggregator.checkAndInsertFalls().catch(err =>
    console.error('Fall aggregation error:', err)
  );
}, 60 * 1000);

// Cleanup once per day
setInterval(() => {
  cleanup.cleanupTempFiles();
}, 24 * 60 * 60 * 1000);

// Health check
setInterval(() => {
  fs.writeFileSync(
    'health.txt',
    new Date().toISOString()
  );
}, 60 * 1000);

console.log('Vitals ingestor running with fall detection');