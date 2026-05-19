import { writeFile } from 'fs/promises';
import path from 'path';
import { mkdir } from 'fs/promises';
import { getCurrentUser } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import { NextResponse } from 'next/server';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

// Magic bytes for common image formats
const MAGIC_BYTES = {
  jpeg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47],
  gif: [0x47, 0x49, 0x46, 0x38],
  webp: [0x52, 0x49, 0x46, 0x46],
};

function validateMagicBytes(buffer) {
  const check = (sig) => sig.every((b, i) => buffer[i] === b);
  return check(MAGIC_BYTES.jpeg) || check(MAGIC_BYTES.png) || check(MAGIC_BYTES.gif) || check(MAGIC_BYTES.webp);
}

export async function POST(request) {
  try {
    const limit = rateLimit(request, { windowMs: 60 * 1000, max: 10, identifier: 'upload' });
    if (!limit.success) {
      return NextResponse.json({ error: 'Слишком много загрузок. Попробуйте позже.' }, { status: 429 });
    }

    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('image');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Файл не загружен' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Недопустимый тип файла. Разрешены: JPG, PNG, WebP, GIF' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    if (bytes.byteLength > MAX_SIZE) {
      return NextResponse.json({ error: 'Файл слишком большой. Максимум 5 МБ' }, { status: 400 });
    }

    const buffer = Buffer.from(bytes);

    if (!validateMagicBytes(buffer)) {
      return NextResponse.json({ error: 'Недопустимое содержимое файла' }, { status: 400 });
    }

    const uploadsDir = process.env.UPLOAD_DIR
      ? path.resolve(process.env.UPLOAD_DIR)
      : path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    const ext = path.extname(file.name || '').toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      return NextResponse.json({ error: 'Недопустимое расширение файла' }, { status: 400 });
    }

    const filename = `product_${Date.now()}${ext}`;
    const filepath = path.join(uploadsDir, filename);

    await writeFile(filepath, buffer);

    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
