import { readData } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

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

function readJSONOrders() {
  if (!fs.existsSync(JSON_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(JSON_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const data = readData();
    const userPhone = user.phone || data.users?.find((u) => u.id === user.id)?.phone;
    const normalizedPhone = userPhone ? normalizePhone(userPhone) : '';

    // 1. Заказы с сайта (по userId)
    const siteOrders = data.orders
      .filter((o) => o.userId === user.id)
      .map((o) => ({
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

    // 2. Заказы без userId (импортированные) - ищем по телефону
    const importedOrders = data.orders
      .filter((o) => !o.userId && normalizedPhone)
      .filter((o) => {
        const orderPhone = normalizePhone(o.phone);
        return orderPhone.includes(normalizedPhone) || normalizedPhone.includes(orderPhone);
      })
      .map((o) => ({
        id: o.id,
        number: `IMP-${String(o.id).slice(-6)}`,
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
        source: 'import',
      }));

    // 3. Заказы из XLS (по телефону)
    let xlsOrders = [];
    if (normalizedPhone) {
      const allXlsOrders = readXLSOrders();
      xlsOrders = allXlsOrders.filter((order) => {
        const orderPhone = normalizePhone(order.clientPhone);
        return orderPhone.includes(normalizedPhone) || normalizedPhone.includes(orderPhone);
      });
    }

    // 4. Заказы из JSON cache (по телефону)
    let jsonOrders = [];
    if (normalizedPhone) {
      const allJsonOrders = readJSONOrders();
      jsonOrders = allJsonOrders.filter((order) => {
        const orderPhone = normalizePhone(order.clientPhone);
        return orderPhone.includes(normalizedPhone) || normalizedPhone.includes(orderPhone);
      });
    }

    // Объединяем: сначала сайт, потом импорт, потом 1С
    const allOrders = [...siteOrders, ...importedOrders, ...xlsOrders, ...jsonOrders];

    return NextResponse.json(allOrders);
  } catch (err) {
    console.error('My orders error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
