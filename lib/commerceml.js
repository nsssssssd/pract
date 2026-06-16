import { XMLParser } from 'fast-xml-parser';
import fs from 'fs';
import path from 'path';

const EXCHANGE_DIR = process.env.ONE_C_EXCHANGE_DIR || 'C:\\1C\\Exchange';
const USE_DEMO_FALLBACK = process.env.ONE_C_USE_DEMO !== 'false'; // по умолчанию включён

// Парсер XML с настройками для CommerceML
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseTagValue: true,
  trimValues: true,
  isArray: (name) => {
    const arrayTags = ['Товар', 'Документ', 'Предложение', 'Группа', 'Цена'];
    return arrayTags.includes(name);
  },
});

// ==================== DEMO DATA (fallback) ====================

const DEMO_ORDERS = [
  {
    id: '1c-demo-1',
    number: 'ЗК-000001',
    date: '2025-06-10',
    status: 'Выполнен',
    total: 15400,
    clientName: 'Иванов Иван',
    clientPhone: '79991234567',
    items: [
      { name: 'Ноутбук ASUS VivoBook', quantity: 1, price: 12000, sum: 12000 },
      { name: 'Мышь беспроводная Logitech', quantity: 2, price: 1700, sum: 3400 },
    ],
    source: '1c',
  },
  {
    id: '1c-demo-2',
    number: 'ЗК-000002',
    date: '2025-06-12',
    status: 'В работе',
    total: 8900,
    clientName: 'Иванов Иван',
    clientPhone: '79991234567',
    items: [
      { name: 'Клавиатура механическая Keychron', quantity: 1, price: 8900, sum: 8900 },
    ],
    source: '1c',
  },
  {
    id: '1c-demo-3',
    number: 'ЗК-000003',
    date: '2025-06-15',
    status: 'Новый',
    total: 3450,
    clientName: 'Иванов Иван',
    clientPhone: '79991234567',
    items: [
      { name: 'USB-C хаб 7-in-1', quantity: 1, price: 3450, sum: 3450 },
    ],
    source: '1c',
  },
];

// ==================== HELPER FUNCTIONS ====================

function safeParseFloat(value) {
  if (value === undefined || value === null) return 0;
  const parsed = parseFloat(String(value).replace(/\s/g, '').replace(',', '.'));
  return isNaN(parsed) ? 0 : parsed;
}

function safeString(value) {
  if (value === undefined || value === null) return '—';
  return String(value).trim();
}

function normalizePhone(phone) {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '');
}

// ==================== PARSE ORDERS ====================

export function parseOrdersFromXML() {
  const ordersFile = path.join(EXCHANGE_DIR, 'orders.xml');

  if (!fs.existsSync(ordersFile)) {
    console.log('CommerceML: orders.xml not found at', ordersFile);
    return [];
  }

  try {
    const xmlData = fs.readFileSync(ordersFile, 'utf-8');
    const parsed = parser.parse(xmlData);

    const commerceInfo = parsed['КоммерческаяИнформация'];
    if (!commerceInfo) {
      console.log('CommerceML: no КоммерческаяИнформация in orders.xml');
      return [];
    }

    const documents = commerceInfo['Документ'];
    if (!documents) {
      console.log('CommerceML: no Документ in orders.xml');
      return [];
    }

    const docsArray = Array.isArray(documents) ? documents : [documents];

    return docsArray.map((doc, index) => {
      let clientName = '—';
      let clientPhone = '';

      const contragents = doc['Контрагенты'];
      if (contragents) {
        const contragent = contragents['Контрагент'];
        if (contragent) {
          const contragentData = Array.isArray(contragent) ? contragent[0] : contragent;
          clientName = safeString(contragentData['Наименование']);
          clientPhone = safeString(contragentData['Телефон'] || contragentData['ТелефонКонтрагента']);
        }
      }

      const items = [];
      const products = doc['Товары'];
      if (products) {
        const productList = products['Товар'];
        if (productList) {
          const productArray = Array.isArray(productList) ? productList : [productList];
          productArray.forEach((item) => {
            items.push({
              name: safeString(item['Наименование']),
              quantity: safeParseFloat(item['Количество']),
              price: safeParseFloat(item['Цена']),
              sum: safeParseFloat(item['Сумма']),
            });
          });
        }
      }

      return {
        id: `1c-${index}`,
        number: safeString(doc['Номер']),
        date: doc['Дата'] || null,
        status: safeString(doc['Статус'] || 'Новый'),
        total: safeParseFloat(doc['Сумма']),
        clientName,
        clientPhone,
        items,
        source: '1c',
      };
    });
  } catch (err) {
    console.error('CommerceML parseOrders error:', err);
    return [];
  }
}

// ==================== PARSE PRODUCTS ====================

export function parseProductsFromXML() {
  const importFile = path.join(EXCHANGE_DIR, 'import.xml');
  const offersFile = path.join(EXCHANGE_DIR, 'offers.xml');

  if (!fs.existsSync(importFile) || !fs.existsSync(offersFile)) {
    console.log('CommerceML: import.xml or offers.xml not found');
    return [];
  }

  try {
    const importData = parser.parse(fs.readFileSync(importFile, 'utf-8'));
    const catalog = importData['КоммерческаяИнформация']?.['Каталог'];
    const products = catalog?.['Товары']?.['Товар'];

    if (!products) {
      console.log('CommerceML: no products in import.xml');
      return [];
    }

    const productsArray = Array.isArray(products) ? products : [products];

    const offersData = parser.parse(fs.readFileSync(offersFile, 'utf-8'));
    const offersPackage = offersData['КоммерческаяИнформация']?.['ПакетПредложений'];
    const offers = offersPackage?.['Предложения']?.['Предложение'];

    const priceMap = {};
    const qtyMap = {};

    if (offers) {
      const offersArray = Array.isArray(offers) ? offers : [offers];
      offersArray.forEach((offer) => {
        const id = offer['Ид'];
        if (!id) return;

        const prices = offer['Цены'];
        if (prices) {
          const priceData = prices['Цена'];
          if (priceData) {
            const priceItem = Array.isArray(priceData) ? priceData[0] : priceData;
            priceMap[id] = safeParseFloat(priceItem['ЦенаЗаЕдиницу']);
          }
        }

        qtyMap[id] = safeParseFloat(offer['Количество']);
      });
    }

    return productsArray.map((product) => {
      const id = product['Ид'];
      return {
        id: safeString(id),
        name: safeString(product['Наименование']),
        article: safeString(product['Артикул']),
        group: safeString(product['Группы']?.['Ид'] || ''),
        price: priceMap[id] || 0,
        quantity: qtyMap[id] || 0,
        description: safeString(product['Описание']),
      };
    });
  } catch (err) {
    console.error('CommerceML parseProducts error:', err);
    return [];
  }
}

// ==================== GET ORDERS BY PHONE ====================

export function getOrdersByPhone(phone) {
  if (!phone) return [];

  const allOrders = parseOrdersFromXML();
  const normalizedPhone = normalizePhone(phone);

  if (!normalizedPhone || normalizedPhone.length < 10) {
    return [];
  }

  const filtered = allOrders.filter((order) => {
    const orderPhone = normalizePhone(order.clientPhone);
    return orderPhone.includes(normalizedPhone) || normalizedPhone.includes(orderPhone);
  });

  // Если реальных заказов нет и включён fallback — возвращаем демо
  if (filtered.length === 0 && USE_DEMO_FALLBACK && allOrders.length === 0) {
    return DEMO_ORDERS.filter((order) => {
      const orderPhone = normalizePhone(order.clientPhone);
      return orderPhone.includes(normalizedPhone) || normalizedPhone.includes(orderPhone);
    });
  }

  return filtered;
}

// ==================== GET ALL ORDERS ====================

export function getAllOrders() {
  const realOrders = parseOrdersFromXML();
  if (realOrders.length > 0) return realOrders;
  if (USE_DEMO_FALLBACK) return DEMO_ORDERS;
  return [];
}

// ==================== GET PRODUCTS ====================

export function getProducts() {
  return parseProductsFromXML();
}

// ==================== CHECK IF CONFIGURED ====================

export function isCommerceMLConfigured() {
  const dirExists = fs.existsSync(EXCHANGE_DIR);
  const ordersFileExists = fs.existsSync(path.join(EXCHANGE_DIR, 'orders.xml'));
  return dirExists || USE_DEMO_FALLBACK;
}

// ==================== GET LAST SYNC TIME ====================

export function getLastSyncTime() {
  const ordersFile = path.join(EXCHANGE_DIR, 'orders.xml');
  if (!fs.existsSync(ordersFile)) return null;

  const stats = fs.statSync(ordersFile);
  return stats.mtime.toISOString();
}

// ==================== DEMO MODE INFO ====================

export function isDemoMode() {
  const ordersFile = path.join(EXCHANGE_DIR, 'orders.xml');
  return USE_DEMO_FALLBACK && !fs.existsSync(ordersFile);
}
