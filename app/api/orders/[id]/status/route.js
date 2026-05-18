import { readData, writeData } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

const ALLOWED_STATUSES = ['new', 'processing', 'shipped', 'delivered', 'cancelled'];

export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    const { id } = await params;
    const { status } = await request.json();

    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Недопустимый статус. Разрешены: ${ALLOWED_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const data = readData();
    const order = data.orders.find((o) => o.id === parseInt(id, 10));
    if (!order) {
      return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 });
    }

    order.status = status;
    writeData(data);
    return NextResponse.json(order);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
