/**
 * 1C HTTP Service integration client
 * 
 * Проксирует запросы к HTTP-сервису 1С:УНФ для получения истории заказов.
 * 
 * Ожидаемые переменные окружения:
 * - ONE_C_BASE_URL — URL публикации 1С (например, https://1c.example.com/unf/hs/orders)
 * - ONE_C_USERNAME — имя пользователя 1С
 * - ONE_C_PASSWORD — пароль пользователя 1С
 * 
 * Ожидаемый формат ответа от HTTP-сервиса 1С:
 * {
 *   "orders": [
 *     {
 *       "number": "ЗК-000001",
 *       "date": "2026-06-10T12:00:00",
 *       "status": "Выполнен",
 *       "total": 1500,
 *       "items": [
 *         { "name": "Розовые тюльпаны", "quantity": 5, "price": 300, "sum": 1500 }
 *       ]
 *     }
 *   ]
 * }
 */

const ONE_C_BASE_URL = process.env.ONE_C_BASE_URL;
const ONE_C_USERNAME = process.env.ONE_C_USERNAME;
const ONE_C_PASSWORD = process.env.ONE_C_PASSWORD;

export function is1CConfigured() {
  return Boolean(ONE_C_BASE_URL && ONE_C_USERNAME && ONE_C_PASSWORD);
}

export async function fetch1COrders(phone) {
  if (!is1CConfigured()) {
    throw new Error('1C integration is not configured');
  }

  // Нормализуем телефон: убираем всё кроме цифр
  const normalizedPhone = phone.replace(/\D/g, '');
  if (normalizedPhone.length < 10) {
    throw new Error('Invalid phone number');
  }

  const url = new URL(`${ONE_C_BASE_URL.replace(/\/$/, '')}/GetOrders`);
  url.searchParams.append('phone', normalizedPhone);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const auth = Buffer.from(`${ONE_C_USERNAME}:${ONE_C_PASSWORD}`).toString('base64');
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`1C returned ${response.status}: ${text}`);
    }

    const data = await response.json();

    // Нормализуем ответ
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
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      throw new Error('1C request timeout');
    }
    throw err;
  }
}
