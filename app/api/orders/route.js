import { readData, writeData } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import { NextResponse } from 'next/server';
import { create1COrder, is1CConfigured } from '@/lib/1c';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const XLS_FILE_LOCAL = path.join(process.cwd(), '1c', 'orders.xls');
const EXCHANGE_DIR = process.env.ONE_C_EXCHANGE_DIR || 'C:\\1C\\Exchange';
const XLS_FILE = path.join(EXCHANGE_DIR, 'orders.xls');

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

    return dataRows.map((row, index) => ({
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
  } catch (err) {
    console.error('XLS read error:', err);
    return [];
  }
}

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

    // 1. Заказы с сайта
    const siteOrders = data.orders.reverse().map((o) => ({
      id: o.id,
      number: `WEB-${String(o.id).slice(-6)}`,
      date: o.createdAt?.split('T')[0],
      status: o.status,
      total: o.total,
      clientName: o.name,
      clientPhone: normalizePhone(o.phone),
      address: o.address || '—',
      items: (o.items || []).map((i) => ({
        name: i.name,
        quantity: i.qty || 1,
        price: i.price,
        sum: i.price * (i.qty || 1),
      })),
      source: 'site',
    }));

    // 2. Заказы из XLS
    const xlsOrders = readXLSOrders();

    // Объединяем: сначала сайт, потом 1С
    const allOrders = [...siteOrders, ...xlsOrders];

    return NextResponse.json(allOrders);
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

    // Отправляем заказ в 1С если интеграция настроена
    let number1C = null;
    if (is1CConfigured()) {
      try {
        const result = await create1COrder({
          number: `WEB-${String(order.id).slice(-6)}`,
          clientName: order.name,
          clientPhone: order.phone,
          items: order.items,
          total: order.total,
          comment: `Адрес: ${order.address}`,
        });
        if (result.success) {
          number1C = result.number1C;
        }
      } catch (err) {
        console.error('[1C] Failed to create order:', err.message);
        // Не прерываем создание заказа на сайте, если 1С недоступна
      }
    }

    if (number1C) {
      order.number1C = number1C;
    }

    data.orders.push(order);
    await writeData(data);
    return NextResponse.json({ success: true, orderId: order.id, number1C }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
