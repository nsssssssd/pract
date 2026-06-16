import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAllOrders, isCommerceMLConfigured, getLastSyncTime } from '@/lib/commerceml';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    if (!isCommerceMLConfigured()) {
      return NextResponse.json(
        { error: 'CommerceML не настроен' },
        { status: 503 }
      );
    }

    const orders = getAllOrders();
    const lastSync = getLastSyncTime();

    return NextResponse.json({ 
      orders, 
      lastSync,
      count: orders.length,
      source: 'commerceml' 
    });
  } catch (err) {
    console.error('CommerceML sync error:', err);
    return NextResponse.json(
      { error: err.message || 'Ошибка синхронизации с 1С' },
      { status: 502 }
    );
  }
}
