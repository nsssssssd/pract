import { readData, writeData } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const ALLOWED_STATUSES = ['new', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const XLS_FILE_LOCAL = path.join(process.cwd(), '1c', 'orders.xls');
const EXCHANGE_DIR = process.env.ONE_C_EXCHANGE_DIR || 'C:\\1C\\Exchange';
const XLS_FILE = path.join(EXCHANGE_DIR, 'orders.xls');
const JSON_FILE = path.join(process.cwd(), '1c', 'orders.json');

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

    // Если ID строковый (1С заказ), обновляем в JSON файле
    if (String(id).startsWith('1c-xls-')) {
      if (!fs.existsSync(JSON_FILE)) {
        return NextResponse.json({ error: 'Заказ 1С не найден' }, { status: 404 });
      }
      
      const xlsOrders = JSON.parse(fs.readFileSync(JSON_FILE, 'utf-8'));
      const order = xlsOrders.find((o) => o.id === id);
      
      if (!order) {
        return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 });
      }

      order.status = status;
      fs.writeFileSync(JSON_FILE, JSON.stringify(xlsOrders, null, 2));
      
      return NextResponse.json(order);
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
