module.exports = {
  mqtt: {
    url: 'mqtt://103.106.72.181:1883',
    topic: 'rsi/data',
    username: 'MEDLOC',
    password: 'MEDLOC'
  },
  db: {
    host: 'localhost',
    user: 'root',
    password: 'YOUR_PASSWORD',
    database: 'YOUR_DATABASE'
  },
  aggregationIntervalMs: 15 * 60 * 1000,
  fallbackEmr: 'UNASSIGNED'
};
