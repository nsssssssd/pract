import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { readData, writeData, clearDataCache } from '@/lib/db';
import { writeFile, mkdir, readdir, unlink, stat } from 'fs/promises';
import path from 'path';

const ALLOWED_EXTS = ['.json'];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_FILES = 10;

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

function normalizeOrder(raw) {
  const order = { ...raw };

  // Поддерживаем имена полей из 1С (clientName/clientPhone) и сайта (name/phone)
  order.name = order.name || order.clientName;
  order.phone = order.phone || order.clientPhone;

  // Нормализуем товары: qty / quantity
  if (Array.isArray(order.items)) {
    order.items = order.items.map((item) => ({
      ...item,
      name: item.name,
      price: item.price,
      qty: item.qty ?? item.quantity,
    }));
  }

  // Переводим русский статус в английский
  order.status = STATUS_MAP[order.status] || order.status || 'new';

  return order;
}

function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9а-яА-Я._-]/g, '_').replace(/_{2,}/g, '_');
}

function getUploadDir() {
  return process.env.ORDERS_UPLOAD_DIR
    ? path.resolve(process.env.ORDERS_UPLOAD_DIR)
    : path.join(process.cwd(), 'public', 'uploads', 'orders');
}

async function cleanupOldFiles(uploadDir) {
  try {
    const files = await readdir(uploadDir);
    const fileStats = await Promise.all(
      files
        .filter((f) => ALLOWED_EXTS.some((ext) => f.toLowerCase().endsWith(ext)))
        .map(async (f) => {
          const s = await stat(path.join(uploadDir, f));
          return { name: f, mtime: s.mtime.getTime() };
        })
    );
    fileStats.sort((a, b) => b.mtime - a.mtime);
    const toDelete = fileStats.slice(MAX_FILES);
    for (const f of toDelete) {
      await unlink(path.join(uploadDir, f.name));
    }
  } catch {
    // ignore
  }
}

function validateOrder(order) {
  const errors = [];
  
  if (!order.name || typeof order.name !== 'string' || order.name.trim().length < 2) {
    errors.push('Имя клиента обязательно (минимум 2 символа)');
  }
  
  if (!order.phone || !/^\+?[\d\s()-]{7,20}$/.test(order.phone)) {
    errors.push('Телефон обязателен');
  }
  
  if (!order.address || typeof order.address !== 'string' || order.address.trim().length < 5) {
    errors.push('Адрес обязателен (минимум 5 символов)');
  }
  
  if (!Array.isArray(order.items) || order.items.length === 0) {
    errors.push('Заказ должен содержать хотя бы 1 товар');
  } else {
    for (const item of order.items) {
      if (!item.name || !item.price || !item.qty) {
        errors.push('Каждый товар должен иметь name, price, qty');
        break;
      }
    }
  }
  
  return errors;
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'append'; // 'append' | 'replace'

    const formData = await request.formData();
    const file = formData.get('orders_file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Файл не загружен' }, { status: 400 });
    }

    const originalName = file.name || 'orders';
    const ext = path.extname(originalName).toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      return NextResponse.json(
        { error: 'Недопустимый формат. Разрешены только JSON файлы' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    if (bytes.byteLength > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Файл слишком большой. Максимум 10 МБ' },
        { status: 400 }
      );
    }

    const uploadDir = getUploadDir();
    await mkdir(uploadDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:T]/g, '_').slice(0, 19);
    const safeName = sanitizeFilename(path.basename(originalName, ext));
    const filename = `${safeName}_${timestamp}${ext}`;
    const filepath = path.join(uploadDir, filename);

    await writeFile(filepath, Buffer.from(bytes));

    // Cleanup old files
    await cleanupOldFiles(uploadDir);

    // Parse JSON
    let ordersData;
    try {
      const content = Buffer.from(bytes).toString('utf-8');
      ordersData = JSON.parse(content);
    } catch (err) {
      return NextResponse.json(
        { error: 'Невалидный JSON файл' },
        { status: 400 }
      );
    }

    // Normalize to array (support both plain array and { orders: [...] } wrapper)
    const rawOrders = Array.isArray(ordersData)
      ? ordersData
      : ordersData?.orders && Array.isArray(ordersData.orders)
        ? ordersData.orders
        : [ordersData];
    const orders = rawOrders.map(normalizeOrder);

    if (orders.length === 0) {
      return NextResponse.json(
        { error: 'JSON файл пустой или не содержит заказов' },
        { status: 400 }
      );
    }

    // Read current data
    const data = readData();

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    const errors = [];

    if (mode === 'replace') {
      // Replace all orders
      data.orders = [];
    }

    for (const order of orders) {
      const validationErrors = validateOrder(order);
      if (validationErrors.length > 0) {
        skipped++;
        errors.push(`Заказ "${order.name || '???'}": ${validationErrors.join(', ')}`);
        continue;
      }

      // Calculate total
      let total = 0;
      for (const item of order.items) {
        total += Number(item.price) * Number(item.qty || 1);
      }

      const newOrder = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        userId: null,
        name: order.name.trim(),
        phone: order.phone,
        address: order.address.trim(),
        items: order.items.map((i) => ({
          id: i.id || Date.now() + Math.floor(Math.random() * 1000),
          name: i.name,
          price: Number(i.price),
          qty: Number(i.qty || 1),
        })),
        total,
        status: order.status || 'new',
        createdAt: order.createdAt || new Date().toISOString(),
        source: 'import',
      };

      data.orders.push(newOrder);
      imported++;
    }

    await writeData(data);
    clearDataCache();

    return NextResponse.json({
      success: true,
      imported,
      updated,
      skipped,
      errors: errors.slice(0, 10),
      total: (data.orders || []).length,
      filename,
    });
  } catch (err) {
    console.error('Orders import error:', err);
    return NextResponse.json(
      { error: err.message || 'Ошибка импорта' },
      { status: 500 }
    );
  }
}
