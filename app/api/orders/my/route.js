import { readData } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    const data = readData();
    return NextResponse.json(data.orders.filter((o) => o.userId === user.id).reverse());
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
