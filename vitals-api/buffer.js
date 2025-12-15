const buffer = {};

function add(roomId, hr, rr) {
  if (!buffer[roomId]) {
    buffer[roomId] = { hr: [], rr: [] };
  }

  if (hr > 0) buffer[roomId].hr.push(hr);
  if (rr > 0) buffer[roomId].rr.push(rr);
}

function consumeAndReset() {
  const snapshot = { ...buffer };
  for (const k in buffer) delete buffer[k];
  return snapshot;
}

module.exports = { add, consumeAndReset };
