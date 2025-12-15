const fs = require('fs');
const path = require('path');

const TMP_DIR = path.join(__dirname, 'tmp');
const RETENTION_DAYS = 3;

function cleanupTempFiles() {
  if (!fs.existsSync(TMP_DIR)) return;

  const now = Date.now();
  const maxAgeMs = RETENTION_DAYS * 24 * 60 * 60 * 1000;

  fs.readdirSync(TMP_DIR).forEach(file => {
    const filePath = path.join(TMP_DIR, file);
    const stat = fs.statSync(filePath);

    if (now - stat.mtimeMs > maxAgeMs) {
      fs.unlinkSync(filePath);
      console.log(`Deleted temp file: ${file}`);
    }
  });
}

module.exports = { cleanupTempFiles };
