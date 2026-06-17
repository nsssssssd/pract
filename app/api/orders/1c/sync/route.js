import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAllOrders, isCommerceMLConfigured, isDemoMode } from '@/lib/commerceml';
import { is1CConfigured, fetch1CAllOrders } from '@/lib/1c';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.isAdmin && user?.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    // Режим 1: HTTP API (удалённый 1С через интернет)
    if (is1CConfigured()) {
      try {
        const orders = await fetch1CAllOrders();
        return NextResponse.json({
          orders,
          source: '1c-http',
          demo: false,
        });
      } catch (err) {
        console.error('1C HTTP API sync error:', err);
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

    const orders = getAllOrders();
    return NextResponse.json({
      orders,
      source: 'commerceml',
      demo: isDemoMode(),
    });
  } catch (err) {
    console.error('1C sync error:', err);
    return NextResponse.json(
      { error: err.message || 'Ошибка синхронизации' },
      { status: 500 }
    );
  }
}
