const minuteBuffer = require('./minuteBuffer');
const fallDetection = require('./fallDetection');
const db = require('./db');
const config = require('./config');

function average(arr) {
  if (!arr.length) return null;
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

async function checkAndInsertFalls() {
  const fallingRooms = fallDetection.getAllFallingRooms();
  
  if (fallingRooms.length === 0) return;

  // Get current minute buffer snapshot without resetting
  const currentData = { ...minuteBuffer.getCurrentSnapshot() };

  for (const roomId of fallingRooms) {
    const data = currentData[roomId];
    
    // Get averages (can be null if no data this minute)
    const avgHr = data ? average(data.hr) : null;
    const avgRr = data ? average(data.rr) : null;
    const lastDistance = data ? data.lastDistance : null;

    // Get patient EMR
    let emrNo = await db.getEmrByRoom(roomId);
    if (!emrNo) emrNo = config.fallbackEmr;

    // Insert fall event with current vitals
    await db.insertFallVitals(emrNo, avgHr, avgRr, lastDistance);
    
    console.log(
      `[FALL ALERT] ${new Date().toISOString()} room=${roomId} emr=${emrNo} hr=${avgHr} rr=${avgRr}`
    );
  }
}

module.exports = { checkAndInsertFalls };