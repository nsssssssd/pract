import { readData, writeData, clearDataCache } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const JSON_FILE_LOCAL = path.join(process.cwd(), '1c', 'orders.json');
const EXCHANGE_DIR = process.env.ONE_C_EXCHANGE_DIR || 'C:\\1C\\Exchange';
const JSON_FILE = path.join(EXCHANGE_DIR, 'orders.json');
const JSON_CACHE_FILE = path.join(process.cwd(), '1c', 'orders.json');

export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    const { id } = await params;
    const idStr = String(id);

    // Заказы из внешних источников (1С JSON / XLS)
    if (idStr.startsWith('1c-json-') || idStr.startsWith('1c-xls-')) {
      const cachePath = fs.existsSync(JSON_FILE_LOCAL) ? JSON_FILE_LOCAL : JSON_CACHE_FILE;
      if (!fs.existsSync(cachePath)) {
        return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 });
      }

      const externalOrders = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
      const filtered = externalOrders.filter((o) => o.id !== idStr);

      if (filtered.length === externalOrders.length) {
        return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 });
      }

      fs.writeFileSync(cachePath, JSON.stringify(filtered, null, 2));
      return NextResponse.json({ success: true });
    }

    // Заказы с сайта из data.json
    const data = readData();
    const orderId = parseInt(id, 10);
    const orderIndex = data.orders.findIndex((o) => o.id === orderId);

    if (orderIndex === -1) {
      return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 });
    }

    data.orders.splice(orderIndex, 1);
    await writeData(data);
    clearDataCache();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete order error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
