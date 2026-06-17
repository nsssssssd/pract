import { NextResponse } from 'next/server';
import { parseUploadedPriceFile } from '@/lib/priceParser';
import { readData, writeData } from '@/lib/db';
import { writeFile, mkdir, readdir, unlink, stat, readFile } from 'fs/promises';
import path from 'path';

const MAX_FILES_PER_SOURCE = 5;
const LOG_FILE = path.join(process.cwd(), 'data', 'cron-import.log');
const LOG_MAX_SIZE = 1024 * 1024; // 1 MB

// Источники данных (редактируйте при адаптации)
const SOURCES = [
  // { url: 'https://поставщик-1.ru/price.xlsx', name: 'Supplier1', format: 'xlsx' },
  // { url: 'https://поставщик-2.ru/price.csv',  name: 'Supplier2', format: 'csv' },
];

function getUploadDir() {
  return process.env.PRICE_UPLOAD_DIR
    ? path.resolve(process.env.PRICE_UPLOAD_DIR)
    : path.join(process.cwd(), 'public', 'uploads', 'prices');
}

async function logMessage(level, message, meta = {}) {
  try {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta,
    };
    const line = JSON.stringify(entry) + '\n';

    // Rotate if needed
    try {
      const s = await stat(LOG_FILE);
      if (s.size > LOG_MAX_SIZE) {
        const oldLog = LOG_FILE + '.old';
        await writeFile(oldLog, await readFile(LOG_FILE));
        await writeFile(LOG_FILE, '');
      }
    } catch {
      // file doesn't exist yet
    }

    await writeFile(LOG_FILE, line, { flag: 'a' });
  } catch (err) {
    console.error('Failed to write log:', err);
  }
}

async function downloadFile(url, destPath, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 300000); // 5 min

      const response = await fetch(url, {
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (TulpanOmsk55 Bot)',
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      await writeFile(destPath, buffer);
      return buffer;
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
  throw new Error('All retries failed');
}

async function cleanupOldFiles(uploadDir, prefix) {
  try {
    const files = await readdir(uploadDir);
    const prefixFiles = files.filter((f) => f.startsWith(prefix + '_'));
    const fileStats = await Promise.all(
      prefixFiles.map(async (f) => {
        const s = await stat(path.join(uploadDir, f));
        return { name: f, mtime: s.mtime.getTime() };
      })
    );
    fileStats.sort((a, b) => b.mtime - a.mtime);
    const toDelete = fileStats.slice(MAX_FILES_PER_SOURCE);
    for (const f of toDelete) {
      await unlink(path.join(uploadDir, f.name));
    }
  } catch {
    // ignore
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const expectedKey = process.env.CRON_SECRET_KEY;

    if (!expectedKey || key !== expectedKey) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (SOURCES.length === 0) {
      return NextResponse.json({
        success: true,
        sources: 0,
        imported: 0,
        updated: 0,
        message: 'Источники не настроены',
      });
    }

    const uploadDir = getUploadDir();
    await mkdir(uploadDir, { recursive: true });

    const allProducts = [];
    let totalImported = 0;
    let totalUpdated = 0;
    const logs = [];

    for (const source of SOURCES) {
      try {
        const timestamp = new Date().toISOString().replace(/[:T]/g, '_').slice(0, 19);
        const filename = `${source.name}_${timestamp}.${source.format}`;
        const filepath = path.join(uploadDir, filename);

        await logMessage('info', `Downloading ${source.url}`, { source: source.name });
        await downloadFile(source.url, filepath);
        await logMessage('info', `Downloaded ${source.url}`, { source: source.name, filename });

        const products = await parseUploadedPriceFile(filepath, source.format);
        allProducts.push(...products);
        totalImported += products.length;

        await cleanupOldFiles(uploadDir, source.name);

        await logMessage('info', `Parsed ${products.length} products`, {
          source: source.name,
          count: products.length,
        });
      } catch (err) {
        const msg = `Source ${source.name} failed: ${err.message}`;
        logs.push(msg);
        await logMessage('error', msg, { source: source.name, error: err.message });
      }
    }

    // Deduplicate: last source wins
    const data = readData();
    const existingByArticle = new Map();
    const existingByName = new Map();
    for (const [idx, p] of (data.products || []).entries()) {
      if (p.article) existingByArticle.set(p.article, idx);
      if (p.name) existingByName.set(p.name, idx);
    }

    for (const p of allProducts) {
      const existingIdx = p.article
        ? existingByArticle.get(p.article)
        : existingByName.get(p.name);

      if (existingIdx !== undefined) {
        const existing = data.products[existingIdx];
        if (!p.image && existing.image) {
          p.image = existing.image;
        }
        data.products[existingIdx] = p;
        totalUpdated++;
        totalImported--;
      } else {
        data.products.push(p);
      }
    }

    await writeData(data);

    await logMessage('info', 'Cron import completed', {
      imported: totalImported,
      updated: totalUpdated,
      total: (data.products || []).length,
    });

    return NextResponse.json({
      success: true,
      sources: SOURCES.length,
      imported: totalImported,
      updated: totalUpdated,
      total: (data.products || []).length,
      logs,
    });
  } catch (err) {
    console.error('Cron import error:', err);
    await logMessage('error', 'Cron import failed', { error: err.message });
    return NextResponse.json(
      { error: err.message || 'Cron import failed' },
      { status: 500 }
    );
  }
}
