import { readData, writeData } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

function validatePhone(phone) {
  const cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  return ['7', '8'].includes(cleaned[0]);
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }
    const data = readData();
    return NextResponse.json(data.orders.reverse());
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, phone, address, items, userId } = await request.json();
    if (!name || !phone || !address || !items?.length) {
      return NextResponse.json({ error: 'Заполните все поля' }, { status: 400 });
    }
    if (!validatePhone(phone)) {
      return NextResponse.json({ error: 'Введите корректный телефон (11 цифр, начиная с 7 или 8)' }, { status: 400 });
    }

    // Check if admin is trying to place order
    const currentUser = await getCurrentUser();
    if (currentUser?.role === 'admin') {
      return NextResponse.json({ error: 'Администраторы не могут оформлять заказы' }, { status: 403 });
    }

    const data = readData();
    const order = {
      id: Date.now(),
      userId: userId || null,
      name,
      phone,
      address,
      items,
      total: items.reduce((s, i) => s + i.price * i.qty, 0),
      status: 'new',
      createdAt: new Date().toISOString(),
    };
    data.orders.push(order);
    writeData(data);
    return NextResponse.json({ success: true, orderId: order.id }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
