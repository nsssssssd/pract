import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAllOrders, isDemoMode } from '@/lib/commerceml';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.isAdmin && user?.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const orders = getAllOrders();
    return NextResponse.json({ 
      orders, 
      source: 'commerceml',
      demo: isDemoMode(),
    });
  } catch (err) {
    console.error('CommerceML sync error:', err);
    return NextResponse.json(
      { error: err.message || 'Ошибка синхронизации' },
      { status: 500 }
    );
  }
}
