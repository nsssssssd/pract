import { NextResponse } from 'next/server';
import { readFile, stat, writeFile } from 'fs/promises';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), 'public', 'uploads', 'imgcache');
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Whitelist of allowed domains (настройте при адаптации)
const ALLOWED_DOMAINS = [
  // 'cdn.supplier1.ru',
  // 'images.supplier2.com',
];

function isAllowedUrl(url) {
  if (ALLOWED_DOMAINS.length === 0) return true; // allow all if not configured
  try {
    const u = new URL(url);
    return ALLOWED_DOMAINS.some((d) => u.hostname === d || u.hostname.endsWith('.' + d));
  } catch {
    return false;
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'URL не указан' }, { status: 400 });
    }

    if (!isAllowedUrl(url)) {
      return NextResponse.json({ error: 'Домен не разрешён' }, { status: 403 });
    }

    const cacheKey = Buffer.from(url).toString('base64').replace(/[/+=]/g, '_');
    const cachePath = path.join(CACHE_DIR, cacheKey);

    // Check cache
    try {
      const s = await stat(cachePath);
      const age = Date.now() - s.mtime.getTime();
      if (age < CACHE_TTL_MS) {
        const data = await readFile(cachePath);
        // Try to detect content type from extension
        const ext = path.extname(new URL(url).pathname).toLowerCase();
        const contentTypeMap = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.gif': 'image/gif',
          '.webp': 'image/webp',
          '.svg': 'image/svg+xml',
        };
        return new NextResponse(data, {
          headers: {
            'Content-Type': contentTypeMap[ext] || 'image/jpeg',
            'Cache-Control': 'public, max-age=604800',
          },
        });
      }
    } catch {
      // cache miss or expired
    }

    // Download
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (TulpanOmsk55 Bot)' },
    });

    if (!response.ok) {
      return NextResponse.json({ error: `HTTP ${response.status}` }, { status: 502 });
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'Not an image' }, { status: 400 });
    }

    const data = Buffer.from(await response.arrayBuffer());

    // Save to cache
    await writeFile(cachePath, data);

    return new NextResponse(data, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=604800',
      },
    });
  } catch (err) {
    console.error('Proxy image error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
