import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { readData, writeData } from '@/lib/db';
import { fetch1CAllOrders, sync1COrderStatuses, is1CConfigured } from '@/lib/1c';

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    if (!is1CConfigured()) {
      return NextResponse.json(
        { error: 'Интеграция с 1С не настроена' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const orders = await fetch1CAllOrders(dateFrom, dateTo);
    return NextResponse.json({ orders });
  } catch (err) {
    console.error('1C all orders fetch error:', err);
    return NextResponse.json(
      { error: err.message || 'Ошибка получения заказов из 1С' },
      { status: 502 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    if (!is1CConfigured()) {
      return NextResponse.json(
        { error: 'Интеграция с 1С не настроена' },
        { status: 503 }
      );
    }

    // Синхронизация статусов заказов из 1С
    const data = readData();
    const ordersWith1C = data.orders.filter((o) => o.number1C);

    if (ordersWith1C.length === 0) {
      return NextResponse.json({ message: 'Нет заказов для синхронизации', synced: 0 });
    }

    const results = await sync1COrderStatuses(ordersWith1C);

    let updatedCount = 0;
    for (const result of results) {
      if (result.synced) {
        const order = data.orders.find((o) => o.id === result.id);
        if (order) {
          order.status = map1CStatusToSite(result.newStatus);
          updatedCount++;
        }
      }
    }

    if (updatedCount > 0) {
      await writeData(data);
    }

    return NextResponse.json({
      message: `Синхронизировано ${updatedCount} из ${results.length} заказов`,
      synced: updatedCount,
      total: results.length,
      results,
    });
  } catch (err) {
    console.error('1C sync error:', err);
    return NextResponse.json(
      { error: err.message || 'Ошибка синхронизации с 1С' },
      { status: 502 }
    );
  }
}

// Маппинг статусов 1С → статусы сайта
function map1CStatusToSite(status1C) {
  const mapping = {
    'Новый': 'new',
    'В работе': 'confirmed',
    'Выполнен': 'delivered',
    'Отменён': 'cancelled',
    'Отменен': 'cancelled',
  };
  return mapping[status1C] || 'new';
}
