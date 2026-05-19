import { readFile } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

const MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

export async function GET(request, { params }) {
  try {
    const { path: pathSegments } = await params;
    const filename = Array.isArray(pathSegments) ? pathSegments.join('/') : pathSegments;

    if (!filename || filename.includes('..')) {
      return new NextResponse('Not found', { status: 404 });
    }

    const uploadsDir = process.env.UPLOAD_DIR
      ? path.resolve(process.env.UPLOAD_DIR)
      : path.join(process.cwd(), 'public', 'uploads');

    const filepath = path.join(uploadsDir, filename);
    const resolved = path.resolve(filepath);
    const resolvedDir = path.resolve(uploadsDir);

    // Security: ensure file is inside uploads directory
    if (!resolved.startsWith(resolvedDir)) {
      return new NextResponse('Not found', { status: 404 });
    }

    const buffer = await readFile(resolved);
    const ext = path.extname(filename).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err) {
    if (err.code === 'ENOENT') {
      return new NextResponse('Not found', { status: 404 });
    }
    return new NextResponse('Internal error', { status: 500 });
  }
}
