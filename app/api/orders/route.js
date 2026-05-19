import { readData, writeData } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
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
    const limit = rateLimit(request, { windowMs: 60 * 1000, max: 5, identifier: 'order' });
    if (!limit.success) {
      return NextResponse.json({ error: 'Слишком много заказов. Попробуйте позже.' }, { status: 429 });
    }

    const body = await request.json();
    const { name, phone, address, items } = body;
    if (!name || !phone || !address || !items?.length) {
      return NextResponse.json({ error: 'Заполните все поля' }, { status: 400 });
    }
    if (typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Имя должно быть не короче 2 символов' }, { status: 400 });
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

    // Validate prices against catalog
    let total = 0;
    for (const item of items) {
      const product = data.products.find((p) => p.id === item.id);
      if (!product) {
        return NextResponse.json({ error: `Товар "${item.name}" не найден в каталоге` }, { status: 400 });
      }
      if (product.price !== item.price) {
        return NextResponse.json(
          { error: `Цена товара "${item.name}" изменилась. Обновите корзину.` },
          { status: 400 }
        );
      }
      total += product.price * (item.qty || 1);
    }

    const order = {
      id: Date.now(),
      userId: currentUser?.id || null,
      name: name.trim(),
      phone,
      address: address.trim(),
      items: items.map((i) => ({ id: i.id, name: i.name, price: i.price, qty: i.qty || 1 })),
      total,
      status: 'new',
      createdAt: new Date().toISOString(),
    };
    data.orders.push(order);
    await writeData(data);
    return NextResponse.json({ success: true, orderId: order.id }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
