import { readData, writeData } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const ALLOWED_STATUSES = ['new', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const XLS_FILE_LOCAL = path.join(process.cwd(), '1c', 'orders.xls');
const JSON_FILE_LOCAL = path.join(process.cwd(), '1c', 'orders.json');
const EXCHANGE_DIR = process.env.ONE_C_EXCHANGE_DIR || 'C:\\1C\\Exchange';
const XLS_FILE = path.join(EXCHANGE_DIR, 'orders.xls');
const JSON_FILE = path.join(EXCHANGE_DIR, 'orders.json');
const JSON_CACHE_FILE = path.join(process.cwd(), '1c', 'orders.cache.json');

// Маппинг русских статусов в английские
const STATUS_MAP = {
  'Новый': 'new',
  'В работе': 'processing',
  'В обработке': 'processing',
  'Подтверждён': 'confirmed',
  'Отправлен': 'shipped',
  'Выполнен': 'delivered',
  'Доставлен': 'delivered',
  'Отменён': 'cancelled',
  'Отменен': 'cancelled',
};

// Обратный маппинг
const REVERSE_STATUS_MAP = {
  new: 'Новый',
  confirmed: 'Подтверждён',
  processing: 'В работе',
  shipped: 'Отправлен',
  delivered: 'Выполнен',
  cancelled: 'Отменён',
};

export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    const { id } = await params;
    let { status } = await request.json();

    // Конвертируем русский статус в английский если нужно
    if (STATUS_MAP[status]) {
      status = STATUS_MAP[status];
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Недопустимый статус. Разрешены: ${ALLOWED_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    // Если ID строковый (1С заказ), обновляем в кеше JSON
    if (String(id).startsWith('1c-xls-') || String(id).startsWith('1c-json-')) {
      if (!fs.existsSync(JSON_CACHE_FILE)) {
        return NextResponse.json({ error: 'Заказ 1С не найден' }, { status: 404 });
      }

      const externalOrders = JSON.parse(fs.readFileSync(JSON_CACHE_FILE, 'utf-8'));
      if (!Array.isArray(externalOrders)) {
        return NextResponse.json({ error: 'Кеш 1С повреждён' }, { status: 500 });
      }

      const orderIndex = externalOrders.findIndex((o) => o.id === id);
      if (orderIndex === -1) {
        return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 });
      }

      externalOrders[orderIndex].status = status;
      externalOrders[orderIndex].statusLabel = REVERSE_STATUS_MAP[status] || status;
      fs.writeFileSync(JSON_CACHE_FILE, JSON.stringify(externalOrders, null, 2));

      return NextResponse.json(externalOrders[orderIndex]);
    }

    // Обычный заказ из data.json
    const data = readData();
    const order = data.orders.find((o) => o.id === parseInt(id, 10));
    if (!order) {
      return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 });
    }

    order.status = status;
    await writeData(data);
    return NextResponse.json(order);
  } catch (err) {
    console.error('Status update error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
