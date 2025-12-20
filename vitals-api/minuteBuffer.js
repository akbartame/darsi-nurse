const buffer = {};

function add(roomId, hr, rr, distance) {
  if (!buffer[roomId]) {
    buffer[roomId] = {
      hr: [],
      rr: [],
      lastDistance: null
    };
  }

  if (hr > 0) buffer[roomId].hr.push(hr);
  if (rr > 0) buffer[roomId].rr.push(rr);
  if (typeof distance === 'number') {
    buffer[roomId].lastDistance = Math.round(distance);
  }
}

function consumeAndReset() {
  const snapshot = { ...buffer };
  for (const k in buffer) delete buffer[k];
  return snapshot;
}

function getCurrentSnapshot() {
  // Return copy without resetting
  return { ...buffer };
}

module.exports = { add, consumeAndReset, getCurrentSnapshot };