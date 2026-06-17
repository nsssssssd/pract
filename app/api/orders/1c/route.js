import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getOrdersByPhone, isCommerceMLConfigured, isDemoMode } from '@/lib/commerceml';
import { is1CConfigured, fetch1COrders } from '@/lib/1c';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
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

    // Режим 1: HTTP API (удалённый 1С через интернет)
    if (is1CConfigured()) {
      try {
        const orders = await fetch1COrders(phone);
        return NextResponse.json({
          orders,
          source: '1c-http',
          demo: false,
          phone: phone.replace(/\d(?=\d{4})/g, '*'),
        });
      } catch (err) {
        console.error('1C HTTP API error:', err);
        return NextResponse.json(
          { error: err.message || 'Ошибка получения заказов из 1С (HTTP API)' },
          { status: 502 }
        );
      }
    }

    // Режим 2: CommerceML (файловый обмен, локальный)
    if (!isCommerceMLConfigured()) {
      return NextResponse.json(
        { error: '1С не настроена. Укажите ONE_C_BASE_URL для HTTP API или настройте CommerceML' },
        { status: 503 }
      );
    }

    const orders = getOrdersByPhone(phone);
    return NextResponse.json({
      orders,
      source: 'commerceml',
      demo: isDemoMode(),
      phone: phone.replace(/\d(?=\d{4})/g, '*'),
    });
  } catch (err) {
    console.error('1C orders fetch error:', err);
    return NextResponse.json(
      { error: err.message || 'Ошибка получения заказов из 1С' },
      { status: 502 }
    );
  }
}
