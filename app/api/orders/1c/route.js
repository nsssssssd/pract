import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getOrdersByPhone, isCommerceMLConfigured, isDemoMode } from '@/lib/commerceml';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    if (!isCommerceMLConfigured()) {
      return NextResponse.json(
        { error: 'CommerceML не настроен. Создайте папку C:\\1C\\Exchange и выгрузите данные из 1С' },
        { status: 503 }
      );
    }

    // Получаем телефон из JWT или БД
    let phone = user.phone || null;
    if (!phone) {
      const { readData } = await import('@/lib/db');
      const data = readData();
      const dbUser = data.users?.find((u) => u.id === user.id);
      phone = dbUser?.phone || null;
    }

    if (!phone) {
      return NextResponse.json(
        { error: 'В профиле не указан телефон для поиска заказов в 1С', code: 'NO_PHONE' },
        { status: 400 }
      );
    }

    const orders = getOrdersByPhone(phone);
    return NextResponse.json({ 
      orders, 
      source: 'commerceml',
      demo: isDemoMode(),
      phone: phone.replace(/\d(?=\d{4})/g, '*'), // маскируем телефон
    });
  } catch (err) {
    console.error('CommerceML orders fetch error:', err);
    return NextResponse.json(
      { error: err.message || 'Ошибка получения заказов из 1С' },
      { status: 502 }
    );
  }
}
