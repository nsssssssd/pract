import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data.json');
const TEMP_FILE = path.join(process.cwd(), 'data.json.tmp');

export function readData() {
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
}

export function writeData(data) {
  // Atomic write: write to temp file, then rename
  fs.writeFileSync(TEMP_FILE, JSON.stringify(data, null, 2));
  fs.renameSync(TEMP_FILE, DATA_FILE);
}
