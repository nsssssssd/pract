import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { readData } from '@/lib/db';
import { fetch1COrders, is1CConfigured } from '@/lib/1c';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    if (!is1CConfigured()) {
      return NextResponse.json(
        { error: 'Интеграция с 1С не настроена' },
        { status: 503 }
      );
    }

    // Получаем телефон: сначала из JWT, затем из БД
    let phone = user.phone || null;
    if (!phone) {
      const data = readData();
      const dbUser = data.users?.find((u) => u.id === user.id);
      phone = dbUser?.phone || null;
    }

    if (!phone) {
      return NextResponse.json(
        { error: 'В профиле не указан телефон для поиска заказов в 1С' },
        { status: 400 }
      );
    }

    const orders = await fetch1COrders(phone);
    return NextResponse.json({ orders });
  } catch (err) {
    console.error('1C orders fetch error:', err);
    return NextResponse.json(
      { error: err.message || 'Ошибка получения заказов из 1С' },
      { status: 502 }
    );
  }
}
