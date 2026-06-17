import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { parseUploadedPriceFile } from '@/lib/priceParser';
import { readData, writeData } from '@/lib/db';
import { writeFile, mkdir, readdir, unlink, stat } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

const ALLOWED_EXTS = ['.csv', '.xls', '.xlsx'];
const MAX_SIZE = 100 * 1024 * 1024; // 100 MB
const MAX_FILES = 10;

function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9а-яА-Я._-]/g, '_').replace(/_{2,}/g, '_');
}

function getUploadDir() {
  return process.env.PRICE_UPLOAD_DIR
    ? path.resolve(process.env.PRICE_UPLOAD_DIR)
    : path.join(process.cwd(), 'public', 'uploads', 'prices');
}

async function cleanupOldFiles(uploadDir) {
  try {
    const files = await readdir(uploadDir);
    const fileStats = await Promise.all(
      files
        .filter((f) => ALLOWED_EXTS.some((ext) => f.toLowerCase().endsWith(ext)))
        .map(async (f) => {
          const s = await stat(path.join(uploadDir, f));
          return { name: f, mtime: s.mtime.getTime() };
        })
    );
    fileStats.sort((a, b) => b.mtime - a.mtime);
    const toDelete = fileStats.slice(MAX_FILES);
    for (const f of toDelete) {
      await unlink(path.join(uploadDir, f.name));
    }
  } catch {
    // ignore
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'append';

    const formData = await request.formData();
    const file = formData.get('price_file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Файл не загружен' }, { status: 400 });
    }

    const originalName = file.name || 'price';
    const ext = path.extname(originalName).toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      return NextResponse.json(
        { error: 'Недопустимый формат. Разрешены: CSV, XLSX, XLS' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    if (bytes.byteLength > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Файл слишком большой. Максимум 100 МБ' },
        { status: 400 }
      );
    }

    const uploadDir = getUploadDir();
    await mkdir(uploadDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:T]/g, '_').slice(0, 19);
    const safeName = sanitizeFilename(path.basename(originalName, ext));
    const filename = `${safeName}_${timestamp}${ext}`;
    const filepath = path.join(uploadDir, filename);

    await writeFile(filepath, Buffer.from(bytes));

    // Cleanup old files
    await cleanupOldFiles(uploadDir);

    // Parse file
    const products = await parseUploadedPriceFile(filepath, ext);

    if (products.length === 0) {
      return NextResponse.json(
        { error: 'Не удалось распознать товары в файле' },
        { status: 400 }
      );
    }

    // Read current data
    const data = readData();

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    const errors = [];

    if (mode === 'replace') {
      // Preserve existing images if possible
      const oldImages = new Map();
      for (const p of data.products || []) {
        if (p.image && p.article) {
          oldImages.set(p.article, p.image);
        }
      }
      // Replace all products
      data.products = products.map((p) => {
        imported++;
        // Restore image if new product has no image but old had one
        if (!p.image && oldImages.has(p.article)) {
          p.image = oldImages.get(p.article);
        }
        return p;
      });
    } else {
      // Append mode with deduplication
      const existingByArticle = new Map();
      const existingByName = new Map();
      for (const [idx, p] of (data.products || []).entries()) {
        if (p.article) existingByArticle.set(p.article, idx);
        if (p.name) existingByName.set(p.name, idx);
      }

      for (const p of products) {
        try {
          const existingIdx = p.article
            ? existingByArticle.get(p.article)
            : existingByName.get(p.name);

          if (existingIdx !== undefined) {
            // Update existing
            const existing = data.products[existingIdx];
            // Preserve image if new one is empty
            if (!p.image && existing.image) {
              p.image = existing.image;
            }
            data.products[existingIdx] = p;
            updated++;
          } else {
            data.products.push(p);
            imported++;
          }
        } catch (err) {
          skipped++;
          errors.push(err.message);
        }
      }
    }

    await writeData(data);

    return NextResponse.json({
      success: true,
      imported,
      updated,
      skipped,
      errors: errors.slice(0, 10),
      total: (data.products || []).length,
      filename,
    });
  } catch (err) {
    console.error('Import error:', err);
    return NextResponse.json(
      { error: err.message || 'Ошибка импорта' },
      { status: 500 }
    );
  }
}
