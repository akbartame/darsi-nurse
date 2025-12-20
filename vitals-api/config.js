module.exports = {
  mqtt: {
    url: 'mqtt://103.106.72.181:1883',
    topics: ['rsi/data', 'hitam'], // Add new topic
    username: 'MEDLOC',
    password: 'MEDLOC'
  },
  db: {
    host: 'localhost',
    user: 'darsinurse',
    password: 'darsinurse123',
    database: 'darsinurse'
  },
  aggregationIntervalMs: 15 * 60 * 1000,
  fallbackEmr: 'UNASSIGNED'
};