import { readData } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const baseUrl = 'https://tulpanomsk55.ru';
    const data = readData();

    const productEntries = data.products
      .filter((p) => p.image)
      .map((p) => {
        return `
    <url>
      <loc>${baseUrl}/products/${p.id}</loc>
      <image:image>
        <image:loc>${baseUrl}${p.image}</image:loc>
        <image:title>${escapeXml(p.name)}</image:title>
        <image:caption>${escapeXml(p.description)}</image:caption>
      </image:image>
    </url>`;
      })
      .join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${productEntries}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  } catch (err) {
    return new NextResponse('<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
      status: 200,
      headers: { 'Content-Type': 'application/xml' },
    });
  }
}

function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
