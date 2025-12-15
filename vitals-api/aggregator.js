const buffer = require('./buffer');
const db = require('./db');
const config = require('./config');

function average(arr) {
  if (!arr.length) return null;
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

async function flush() {
  const data = buffer.consumeAndReset();

  for (const roomId of Object.keys(data)) {
    const avgHr = average(data[roomId].hr);
    const avgRr = average(data[roomId].rr);

    if (avgHr === null && avgRr === null) continue;

    let emrNo = await db.getEmrByRoom(roomId);
    if (!emrNo) emrNo = config.fallbackEmr;

    await db.insertVitals(emrNo, avgHr, avgRr);
  }
}

module.exports = { flush };
