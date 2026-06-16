import { XMLParser } from 'fast-xml-parser';
import fs from 'fs';
import path from 'path';

const EXCHANGE_DIR = process.env.ONE_C_EXCHANGE_DIR || 'C:\\1C\\Exchange';

// Парсер XML с настройками для CommerceML
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseTagValue: true,
  trimValues: true,
  isArray: (name) => {
    // Всегда возвращаем массив для этих тегов
    const arrayTags = ['Товар', 'Документ', 'Предложение', 'Группа', 'Цена'];
    return arrayTags.includes(name);
  },
});

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
    
    // Документ может быть один или массив
    const docsArray = Array.isArray(documents) ? documents : [documents];
    
    return docsArray.map((doc, index) => {
      // Контрагент
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
      
      // Товары
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
    // Парсим import.xml (номенклатура)
    const importData = parser.parse(fs.readFileSync(importFile, 'utf-8'));
    const catalog = importData['КоммерческаяИнформация']?.['Каталог'];
    const products = catalog?.['Товары']?.['Товар'];
    
    if (!products) {
      console.log('CommerceML: no products in import.xml');
      return [];
    }
    
    const productsArray = Array.isArray(products) ? products : [products];
    
    // Парсим offers.xml (цены и остатки)
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
    
    // Объединяем данные
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
  const normalizedPhone = phone.replace(/\D/g, '');
  
  if (!normalizedPhone || normalizedPhone.length < 10) {
    return [];
  }
  
  return allOrders.filter((order) => {
    const orderPhone = (order.clientPhone || '').replace(/\D/g, '');
    return orderPhone.includes(normalizedPhone) || normalizedPhone.includes(orderPhone);
  });
}

// ==================== GET ALL ORDERS ====================

export function getAllOrders() {
  return parseOrdersFromXML();
}

// ==================== GET PRODUCTS ====================

export function getProducts() {
  return parseProductsFromXML();
}

// ==================== CHECK IF CONFIGURED ====================

export function isCommerceMLConfigured() {
  return fs.existsSync(EXCHANGE_DIR);
}

// ==================== GET LAST SYNC TIME ====================

export function getLastSyncTime() {
  const ordersFile = path.join(EXCHANGE_DIR, 'orders.xml');
  if (!fs.existsSync(ordersFile)) return null;
  
  const stats = fs.statSync(ordersFile);
  return stats.mtime.toISOString();
}
