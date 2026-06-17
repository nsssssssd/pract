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

function normalizePhone(phone) {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '');
}

function parseItems(itemsString) {
  if (!itemsString) return [];
  const items = [];
  const parts = itemsString.split(';');
  for (const part of parts) {
    const match = part.trim().match(/^(.+?):\s*(\d+)\s*шт\s*x\s*(\d+)\s*=\s*(\d+)$/);
    if (match) {
      items.push({
        name: match[1].trim(),
        quantity: Number(match[2]),
        price: Number(match[3]),
        sum: Number(match[4]),
      });
    }
  }
  return items;
}

function readXLSOrders() {
  let xlsPath = null;
  if (fs.existsSync(XLS_FILE_LOCAL)) {
    xlsPath = XLS_FILE_LOCAL;
  } else if (fs.existsSync(XLS_FILE)) {
    xlsPath = XLS_FILE;
  }
  if (!xlsPath) return [];

  try {
    const workbook = XLSX.readFile(xlsPath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const dataRows = rows.slice(1);

    const orders = dataRows.map((row, index) => ({
      id: `1c-xls-${index}`,
      number: String(row[0] || '—'),
      date: row[1] ? String(row[1]) : null,
      status: String(row[2] || 'Новый'),
      total: Number(row[3] || 0),
      clientName: String(row[4] || '—'),
      clientPhone: normalizePhone(String(row[5] || '')),
      address: String(row[6] || '—'),
      items: parseItems(String(row[7] || '')),
      source: '1c-xls',
    }));

    // Сохраняем в JSON для удобства
    try {
      fs.writeFileSync(JSON_FILE, JSON.stringify(orders, null, 2));
    } catch (e) {
      console.error('Failed to write JSON cache:', e);
    }

    return orders;
  } catch (err) {
    console.error('XLS read error:', err);
    // Если XLS не читается, пробуем JSON
    if (fs.existsSync(JSON_FILE)) {
      try {
        return JSON.parse(fs.readFileSync(JSON_FILE, 'utf-8'));
      } catch (e) {
        return [];
      }
    }
    return [];
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    const { id } = await params;
    const { status } = await request.json();

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
