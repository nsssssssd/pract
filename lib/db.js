import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data.json');
const TEMP_FILE = path.join(process.cwd(), 'data.json.tmp');

let writePromise = Promise.resolve();

export function readData() {
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
}

export async function writeData(data) {
  // Chain writes to avoid race conditions
  writePromise = writePromise.then(() => {
    fs.writeFileSync(TEMP_FILE, JSON.stringify(data, null, 2));
    fs.renameSync(TEMP_FILE, DATA_FILE);
  });
  return writePromise;
}
