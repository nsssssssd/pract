import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { readData, writeData } from '@/lib/db';

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    // Call the cron endpoint internally
    const cronKey = process.env.CRON_SECRET_KEY;
    if (!cronKey) {
      return NextResponse.json(
        { error: 'CRON_SECRET_KEY не настроен' },
        { status: 503 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/admin/import/cron?key=${cronKey}`, {
      method: 'GET',
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('Cron trigger error:', err);
    return NextResponse.json(
      { error: err.message || 'Ошибка запуска cron' },
      { status: 500 }
    );
  }
}
