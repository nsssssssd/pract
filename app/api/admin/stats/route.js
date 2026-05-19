import { readData } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }
    const data = readData();
    const orders = data.orders;
    return NextResponse.json({
      totalOrders: orders.length,
      totalRevenue: orders.reduce((s, o) => s + o.total, 0),
      newOrders: orders.filter((o) => o.status === 'new').length,
      totalUsers: data.users.filter((u) => u.role !== 'admin').length,
      totalProducts: data.products.length,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
