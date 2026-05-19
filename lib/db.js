import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data.json');
const TEMP_FILE = path.join(process.cwd(), 'data.json.tmp');

let writePromise = Promise.resolve();
let cache = null;
let cacheTime = 0;
const CACHE_TTL_MS = 5000; // 5 seconds in-memory cache

export function readData() {
  const now = Date.now();
  if (cache && now - cacheTime < CACHE_TTL_MS) {
    return cache;
  }
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  cache = JSON.parse(raw);
  cacheTime = now;
  return cache;
}

export async function writeData(data) {
  // Chain writes to avoid race conditions
  writePromise = writePromise.then(() => {
    fs.writeFileSync(TEMP_FILE, JSON.stringify(data, null, 2));
    fs.renameSync(TEMP_FILE, DATA_FILE);
    cache = null;
    cacheTime = 0;
  });
  return writePromise;
}
