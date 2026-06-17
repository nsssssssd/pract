import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { readdir, stat, unlink } from 'fs/promises';
import path from 'path';

const ALLOWED_EXTS = ['.csv', '.xls', '.xlsx'];

function getUploadDir() {
  return process.env.PRICE_UPLOAD_DIR
    ? path.resolve(process.env.PRICE_UPLOAD_DIR)
    : path.join(process.cwd(), 'public', 'uploads', 'prices');
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    const uploadDir = getUploadDir();
    let files = [];
    try {
      const allFiles = await readdir(uploadDir);
      files = await Promise.all(
        allFiles
          .filter((f) => ALLOWED_EXTS.some((ext) => f.toLowerCase().endsWith(ext)))
          .map(async (f) => {
            const s = await stat(path.join(uploadDir, f));
            return {
              name: f,
              size: s.size,
              date: s.mtime.toISOString(),
            };
          })
      );
      files.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch {
      // directory may not exist
    }

    return NextResponse.json({ files });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('name');

    if (!filename) {
      return NextResponse.json({ error: 'Имя файла не указано' }, { status: 400 });
    }

    // Prevent path traversal
    const safeName = path.basename(filename);
    if (!ALLOWED_EXTS.some((ext) => safeName.toLowerCase().endsWith(ext))) {
      return NextResponse.json({ error: 'Недопустимый файл' }, { status: 400 });
    }

    const uploadDir = getUploadDir();
    const filepath = path.join(uploadDir, safeName);

    // Ensure file is within uploadDir
    if (!filepath.startsWith(uploadDir)) {
      return NextResponse.json({ error: 'Недопустимый путь' }, { status: 400 });
    }

    await unlink(filepath);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
