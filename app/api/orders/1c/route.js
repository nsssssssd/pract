import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getOrdersByPhone, isCommerceMLConfigured, isDemoMode } from '@/lib/commerceml';
import { is1CConfigured, fetch1COrders } from '@/lib/1c';
import { readData } from '@/lib/db';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const EXCHANGE_DIR = process.env.ONE_C_EXCHANGE_DIR || 'C:\\1C\\Exchange';
const XLS_FILE = path.join(EXCHANGE_DIR, 'orders.xls');
const JSON_FILE = path.join(EXCHANGE_DIR, 'orders.json');
// Также ищем в папке проекта (для тестирования)
const XLS_FILE_LOCAL = path.join(process.cwd(), '1c', 'orders.xls');
const JSON_FILE_LOCAL = path.join(process.cwd(), '1c', 'orders.json');

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    // Получаем телефон из JWT или БД
    let phone = user.phone || null;
    if (!phone) {
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

    // Режим 2: JSON файловый обмен (локальный)
    // Ищем сначала в папке проекта, потом в ONE_C_EXCHANGE_DIR
    let jsonPath = null;
    if (fs.existsSync(JSON_FILE_LOCAL)) {
      jsonPath = JSON_FILE_LOCAL;
    } else if (fs.existsSync(JSON_FILE)) {
      jsonPath = JSON_FILE;
    }

    if (jsonPath) {
      try {
        const raw = fs.readFileSync(jsonPath, 'utf-8');
        const parsed = JSON.parse(raw);
        const allOrders = (parsed.orders || []).map((order, index) => ({
          id: `1c-json-${index}`,
          number: String(order.number || '—'),
          date: order.date || null,
          status: String(order.status || 'Новый'),
          total: Number(order.total || 0),
          clientName: String(order.clientName || '—'),
          clientPhone: normalizePhone(String(order.clientPhone || '')),
          address: String(order.address || '—'),
          items: (order.items || []).map((item) => ({
            name: String(item.name || '—'),
            quantity: Number(item.quantity || item.qty || 1),
            price: Number(item.price || 0),
            sum: Number(item.sum || item.total || item.price * (item.quantity || item.qty || 1)),
          })),
          source: '1c-json',
        }));

        const normalizedPhone = normalizePhone(phone);
        const filtered = allOrders.filter((order) => {
          const orderPhone = normalizePhone(order.clientPhone);
          return orderPhone.includes(normalizedPhone) || normalizedPhone.includes(orderPhone);
        });

        return NextResponse.json({
          orders: filtered,
          source: '1c-json',
          demo: false,
          phone: phone.replace(/\d(?=\d{4})/g, '*'),
        });
      } catch (err) {
        console.error('JSON parse error:', err);
        return NextResponse.json(
          { error: 'Ошибка чтения JSON файла: ' + err.message },
          { status: 500 }
        );
      }
    }

    // Режим 3: XLS файловый обмен (локальный)
    // Ищем сначала в папке проекта, потом в ONE_C_EXCHANGE_DIR
    let xlsPath = null;
    if (fs.existsSync(XLS_FILE_LOCAL)) {
      xlsPath = XLS_FILE_LOCAL;
    } else if (fs.existsSync(XLS_FILE)) {
      xlsPath = XLS_FILE;
    }

    if (xlsPath) {
      try {
        const workbook = XLSX.readFile(xlsPath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Пропускаем заголовок (первая строка)
        const dataRows = rows.slice(1);
        
        const allOrders = dataRows.map((row, index) => ({
          id: `1c-xls-${index}`,
          number: String(row[0] || '—'),
          date: row[1] ? formatExcelDate(row[1]) : null,
          status: String(row[2] || 'Новый'),
          total: Number(row[3] || 0),
          clientName: String(row[4] || '—'),
          clientPhone: normalizePhone(String(row[5] || '')),
          address: String(row[6] || '—'),
          items: parseItems(String(row[7] || '')),
          source: '1c-xls',
        }));

        const normalizedPhone = normalizePhone(phone);
        const filtered = allOrders.filter((order) => {
          const orderPhone = normalizePhone(order.clientPhone);
          return orderPhone.includes(normalizedPhone) || normalizedPhone.includes(orderPhone);
        });

        return NextResponse.json({
          orders: filtered,
          source: '1c-xls',
          demo: false,
          phone: phone.replace(/\d(?=\d{4})/g, '*'),
        });
      } catch (err) {
        console.error('XLS parse error:', err);
        return NextResponse.json(
          { error: 'Ошибка чтения XLS файла: ' + err.message },
          { status: 500 }
        );
      }
    }

    // Режим 4: CommerceML XML (fallback)
    if (!isCommerceMLConfigured()) {
      return NextResponse.json(
        { error: '1С не настроена. Укажите ONE_C_BASE_URL для HTTP API, положите orders.xls, или настройте CommerceML' },
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

function normalizePhone(phone) {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '');
}

function formatExcelDate(value) {
  if (typeof value === 'number') {
    // Excel serial date
    const epoch = new Date(1899, 11, 30);
    const date = new Date(epoch.getTime() + value * 24 * 60 * 60 * 1000);
    return date.toISOString().split('T')[0];
  }
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }
  return String(value);
}

function parseItems(itemsString) {
  if (!itemsString) return [];
  // Формат: "Товар1: 5 шт x 150 = 750; Товар2: 1 шт x 2990 = 2990"
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
