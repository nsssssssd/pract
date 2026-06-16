/**
 * 1C HTTP Service integration client
 * 
 * Проксирует запросы к HTTP-сервису 1С:УНФ для работы с заказами.
 * 
 * Ожидаемые переменные окружения:
 * - ONE_C_BASE_URL — URL публикации 1С (например, https://1c.example.com/unf/hs/orders)
 * - ONE_C_USERNAME — имя пользователя 1С
 * - ONE_C_PASSWORD — пароль пользователя 1С
 * 
 * Эндпоинты HTTP-сервиса 1С:
 * GET /GetOrders?phone={phone} — получить заказы клиента по телефону
 * POST /CreateOrder — создать заказ в 1С
 * GET /GetOrderStatus?number={number} — получить статус заказа по номеру
 * GET /GetAllOrders?dateFrom={date}&dateTo={date} — получить все заказы (для админа)
 */

const ONE_C_BASE_URL = process.env.ONE_C_BASE_URL;
const ONE_C_USERNAME = process.env.ONE_C_USERNAME;
const ONE_C_PASSWORD = process.env.ONE_C_PASSWORD;

export function is1CConfigured() {
  return Boolean(ONE_C_BASE_URL && ONE_C_USERNAME && ONE_C_PASSWORD);
}

function getAuthHeader() {
  const auth = Buffer.from(`${ONE_C_USERNAME}:${ONE_C_PASSWORD}`).toString('base64');
  return `Basic ${auth}`;
}

function buildUrl(path) {
  return `${ONE_C_BASE_URL.replace(/\/$/, '')}${path}`;
}

async function fetch1C(path, options = {}) {
  if (!is1CConfigured()) {
    throw new Error('1C integration is not configured');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(buildUrl(path), {
      ...options,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': getAuthHeader(),
        ...options.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`1C returned ${response.status}: ${text}`);
    }

    return await response.json();
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      throw new Error('1C request timeout');
    }
    throw err;
  }
}

// ==================== GET ORDERS BY PHONE ====================

export async function fetch1COrders(phone) {
  const normalizedPhone = phone.replace(/\D/g, '');
  if (normalizedPhone.length < 10) {
    throw new Error('Invalid phone number');
  }

  const data = await fetch1C(`/GetOrders?phone=${encodeURIComponent(normalizedPhone)}`);

  const orders = Array.isArray(data.orders) ? data.orders : Array.isArray(data) ? data : [];

  return orders.map((order) => ({
    number: order.number || order.Номер || '—',
    date: order.date || order.Дата || null,
    status: order.status || order.Статус || '—',
    total: Number(order.total || order.Сумма || 0),
    items: Array.isArray(order.items || order.Товары)
      ? (order.items || order.Товары).map((item) => ({
          name: item.name || item.Номенклатура || item.Наименование || '—',
          quantity: Number(item.quantity || item.Количество || 1),
          price: Number(item.price || item.Цена || 0),
          sum: Number(item.sum || item.Сумма || 0),
        }))
      : [],
  }));
}

// ==================== CREATE ORDER IN 1C ====================

export async function create1COrder(orderData) {
  const payload = {
    number: orderData.number,
    date: orderData.date || new Date().toISOString(),
    client: {
      name: orderData.clientName || orderData.name || 'Клиент',
      phone: orderData.clientPhone || orderData.phone || '',
    },
    items: (orderData.items || []).map((item) => ({
      name: item.name,
      quantity: Number(item.quantity || item.qty || 1),
      price: Number(item.price || 0),
      sum: Number(item.sum || item.total || (item.price * (item.quantity || item.qty || 1))),
    })),
    total: Number(orderData.total || 0),
    comment: orderData.comment || orderData.address || '',
  };

  const data = await fetch1C('/CreateOrder', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return {
    success: data.success || data.Успешно || false,
    number1C: data.number1C || data.Номер1С || data['1cNumber'] || null,
    status: data.status || data.Статус || 'Новый',
  };
}

// ==================== GET ORDER STATUS ====================

export async function fetch1COrderStatus(number) {
  const data = await fetch1C(`/GetOrderStatus?number=${encodeURIComponent(number)}`);

  return {
    number: data.number || data.Номер || number,
    status: data.status || data.Статус || '—',
    date: data.date || data.Дата || null,
  };
}

// ==================== GET ALL ORDERS (ADMIN) ====================

export async function fetch1CAllOrders(dateFrom, dateTo) {
  const params = new URLSearchParams();
  if (dateFrom) params.append('dateFrom', dateFrom);
  if (dateTo) params.append('dateTo', dateTo);

  const query = params.toString() ? `?${params.toString()}` : '';
  const data = await fetch1C(`/GetAllOrders${query}`);

  const orders = Array.isArray(data.orders) ? data.orders : Array.isArray(data) ? data : [];

  return orders.map((order) => ({
    number: order.number || order.Номер || '—',
    date: order.date || order.Дата || null,
    status: order.status || order.Статус || '—',
    total: Number(order.total || order.Сумма || 0),
    clientName: order.clientName || order.Клиент || order.client?.name || '—',
    clientPhone: order.clientPhone || order.Телефон || order.client?.phone || '—',
    items: Array.isArray(order.items || order.Товары)
      ? (order.items || order.Товары).map((item) => ({
          name: item.name || item.Номенклатура || item.Наименование || '—',
          quantity: Number(item.quantity || item.Количество || 1),
          price: Number(item.price || item.Цена || 0),
          sum: Number(item.sum || item.Сумма || 0),
        }))
      : [],
  }));
}

// ==================== SYNC ORDER STATUSES ====================

export async function sync1COrderStatuses(orders) {
  const results = [];

  for (const order of orders) {
    try {
      const status = await fetch1COrderStatus(order.number1C || order.number);
      results.push({
        id: order.id,
        number: order.number,
        number1C: order.number1C,
        oldStatus: order.status,
        newStatus: status.status,
        synced: status.status !== order.status,
      });
    } catch (err) {
      results.push({
        id: order.id,
        number: order.number,
        number1C: order.number1C,
        oldStatus: order.status,
        newStatus: order.status,
        synced: false,
        error: err.message,
      });
    }
  }

  return results;
}
