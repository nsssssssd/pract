# Интеграция через CommerceML (файловый обмен)

## Как это работает

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   1С:УНФ        │         │   XML файлы     │         │   Next.js API   │
│   (учебная)     │──export──►│   CommerceML    │──import──►│   (Node.js)     │
│                 │         │   import.xml    │         │                 │
│                 │         │   offers.xml    │         │                 │
│                 │         │   orders.xml    │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

## Шаг 1: Настройка выгрузки из 1С

### 1.1 Открыть УНФ

Запустите 1С:Предприятие с базой УНФ.

### 1.2 Перейти в настройки обмена

```
Настройки → Обмен с сайтом
```

Или:
```
CRM → Интернет-магазин → Настройка обмена
```

### 1.3 Создать новый узел обмена

1. Нажмите **"Создать"** или **"Добавить узел"**
2. Выберите **"Обмен через каталог"** (не HTTP!)
3. Укажите путь к каталогу: `C:\1C\Exchange\`

### 1.4 Настройка параметров

| Параметр | Значение |
|----------|----------|
| **Имя узла** | `MyShop` |
| **Способ обмена** | Каталог |
| **Каталог выгрузки** | `C:\1C\Exchange\` |
| **Формат обмена** | CommerceML 2.08 |

### 1.5 Что выгружать

Установите галочки:
- ✅ **Выгружать товары** — номенклатура
- ✅ **Выгружать остатки** — количество на складе
- ✅ **Выгружать цены** — прайс-лист
- ✅ **Загружать заказы** — заказы с сайта
- ✅ **Обмен статусами заказов** — статусы из 1С

### 1.6 Виды цен

Выберите вид цен для выгрузки:
- **Розничная** (или какой у вас используется)

### 1.7 Сохранить настройки

Нажмите **"Записать и закрыть"**.

---

## Шаг 2: Ручная выгрузка данных

### 2.1 Выгрузить товары

В форме обмена нажмите:
```
Выгрузить данные → Товары
```

В каталоге `C:\1C\Exchange\` появятся файлы:
- `import.xml` — структура номенклатуры
- `offers.xml` — цены и остатки

### 2.2 Выгрузить заказы

Нажмите:
```
Выгрузить данные → Заказы
```

Появится файл:
- `orders.xml` — заказы покупателей

---

## Шаг 3: Формат файлов CommerceML

### 3.1 import.xml — Номенклатура

```xml
<?xml version="1.0" encoding="UTF-8"?>
<КоммерческаяИнформация ВерсияСхемы="2.08">
  <Классификатор>
    <Ид>catalog</Ид>
    <Наименование>Каталог товаров</Наименование>
    <Группы>
      <Группа>
        <Ид>group1</Ид>
        <Наименование>Ноутбуки</Наименование>
      </Группа>
    </Группы>
  </Классификатор>
  <Каталог>
    <Ид>catalog</Ид>
    <Наименование>Каталог товаров</Наименование>
    <Товары>
      <Товар>
        <Ид>product001</Ид>
        <Наименование>Ноутбук ASUS</Наименование>
        <Группы>
          <Ид>group1</Ид>
        </Группы>
        <Картинка>images/product001.jpg</Картинка>
      </Товар>
    </Товары>
  </Каталог>
</КоммерческаяИнформация>
```

### 3.2 offers.xml — Цены и остатки

```xml
<?xml version="1.0" encoding="UTF-8"?>
<КоммерческаяИнформация ВерсияСхемы="2.08">
  <ПакетПредложений>
    <Ид>offers</Ид>
    <Наименование>Предложения</Наименование>
    <ТипыЦен>
      <ТипЦены>
        <Ид>retail</Ид>
        <Наименование>Розничная</Наименование>
      </ТипЦены>
    </ТипыЦен>
    <Предложения>
      <Предложение>
        <Ид>product001</Ид>
        <Наименование>Ноутбук ASUS</Наименование>
        <Цены>
          <Цена>
            <ИдПредложения>product001</ИдПредложения>
            <ИдТипаЦены>retail</ИдТипаЦены>
            <ЦенаЗаЕдиницу>12000.00</ЦенаЗаЕдиницу>
          </Цена>
        </Цены>
        <Количество>15</Количество>
      </Предложение>
    </Предложения>
  </ПакетПредложений>
</КоммерческаяИнформация>
```

### 3.3 orders.xml — Заказы

```xml
<?xml version="1.0" encoding="UTF-8"?>
<КоммерческаяИнформация ВерсияСхемы="2.08">
  <Документ>
    <Ид>order001</Ид>
    <Номер>ЗК-000001</Номер>
    <Дата>2025-06-15</Дата>
    <ХозОперация>Заказ товара</ХозОперация>
    <Роль>Продавец</Роль>
    <Валюта>руб</Валюта>
    <Курс>1</Курс>
    <Сумма>15400.00</Сумма>
    <Контрагенты>
      <Контрагент>
        <Ид>client001</Ид>
        <Наименование>Иванов Иван</Наименование>
        <Телефон>79991234567</Телефон>
      </Контрагент>
    </Контрагенты>
    <Товары>
      <Товар>
        <Ид>product001</Ид>
        <Наименование>Ноутбук ASUS</Наименование>
        <Количество>1</Количество>
        <Цена>12000.00</Цена>
        <Сумма>12000.00</Сумма>
      </Товар>
      <Товар>
        <Ид>product002</Ид>
        <Наименование>Мышь беспроводная</Наименование>
        <Количество>2</Количество>
        <Цена>1700.00</Цена>
        <Сумма>3400.00</Сумма>
      </Товар>
    </Товары>
  </Документ>
</КоммерческаяИнформация>
```

---

## Шаг 4: Создание парсера CommerceML в Next.js

### 4.1 Установка зависимостей

```bash
npm install fast-xml-parser
```

### 4.2 Создание парсера

Создайте файл `lib/commerceml.js`:

```javascript
import { XMLParser } from 'fast-xml-parser';
import fs from 'fs';
import path from 'path';

const EXCHANGE_DIR = 'C:\\1C\\Exchange';

// Парсер XML
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseTagValue: true,
  trimValues: true,
});

// ==================== PARSE ORDERS ====================

export function parseOrdersFromXML() {
  const ordersFile = path.join(EXCHANGE_DIR, 'orders.xml');
  
  if (!fs.existsSync(ordersFile)) {
    return [];
  }
  
  const xmlData = fs.readFileSync(ordersFile, 'utf-8');
  const parsed = parser.parse(xmlData);
  
  // CommerceML структура
  const commerceInfo = parsed['КоммерческаяИнформация'];
  if (!commerceInfo) return [];
  
  const documents = commerceInfo['Документ'];
  if (!documents) return [];
  
  // Может быть один документ или массив
  const docsArray = Array.isArray(documents) ? documents : [documents];
  
  return docsArray.map((doc) => {
    // Контрагент
    const contragents = doc['Контрагенты']?.['Контрагент'];
    const contragent = Array.isArray(contragents) ? contragents[0] : contragents;
    
    // Товары
    const products = doc['Товары']?.['Товар'];
    const productsArray = Array.isArray(products) ? products : products ? [products] : [];
    
    return {
      number: doc['Номер'] || '—',
      date: doc['Дата'] || null,
      status: doc['Статус'] || 'Новый',
      total: parseFloat(doc['Сумма']) || 0,
      clientName: contragent?.['Наименование'] || '—',
      clientPhone: contragent?.['Телефон'] || '',
      items: productsArray.map((item) => ({
        name: item['Наименование'] || '—',
        quantity: parseFloat(item['Количество']) || 1,
        price: parseFloat(item['Цена']) || 0,
        sum: parseFloat(item['Сумма']) || 0,
      })),
    };
  });
}

// ==================== PARSE PRODUCTS ====================

export function parseProductsFromXML() {
  const importFile = path.join(EXCHANGE_DIR, 'import.xml');
  const offersFile = path.join(EXCHANGE_DIR, 'offers.xml');
  
  if (!fs.existsSync(importFile) || !fs.existsSync(offersFile)) {
    return [];
  }
  
  // Парсим import.xml (номенклатура)
  const importData = parser.parse(fs.readFileSync(importFile, 'utf-8'));
  const catalog = importData['КоммерческаяИнформация']?.['Каталог'];
  const products = catalog?.['Товары']?.['Товар'];
  const productsArray = Array.isArray(products) ? products : products ? [products] : [];
  
  // Парсим offers.xml (цены и остатки)
  const offersData = parser.parse(fs.readFileSync(offersFile, 'utf-8'));
  const offersPackage = offersData['КоммерческаяИнформация']?.['ПакетПредложений'];
  const offers = offersPackage?.['Предложения']?.['Предложение'];
  const offersArray = Array.isArray(offers) ? offers : offers ? [offers] : [];
  
  // Создаём карту цен
  const priceMap = {};
  const qtyMap = {};
  
  offersArray.forEach((offer) => {
    const id = offer['Ид'];
    const price = offer['Цены']?.['Цена']?.['ЦенаЗаЕдиницу'];
    const qty = offer['Количество'];
    
    if (id) {
      priceMap[id] = parseFloat(price) || 0;
      qtyMap[id] = parseFloat(qty) || 0;
    }
  });
  
  // Объединяем данные
  return productsArray.map((product) => {
    const id = product['Ид'];
    return {
      id,
      name: product['Наименование'] || '—',
      group: product['Группы']?.['Ид'] || '',
      price: priceMap[id] || 0,
      quantity: qtyMap[id] || 0,
    };
  });
}

// ==================== GET ORDERS BY PHONE ====================

export function getOrdersByPhone(phone) {
  const allOrders = parseOrdersFromXML();
  const normalizedPhone = phone.replace(/\D/g, '');
  
  return allOrders.filter((order) => {
    const orderPhone = (order.clientPhone || '').replace(/\D/g, '');
    return orderPhone.includes(normalizedPhone);
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
```

---

## Шаг 5: API Routes для CommerceML

### 5.1 Создать API для заказов

Создайте/обновите `app/api/orders/1c/route.js`:

```javascript
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getOrdersByPhone, getAllOrders } from '@/lib/commerceml';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    // Получаем телефон из профиля
    let phone = user.phone || null;
    if (!phone) {
      return NextResponse.json(
        { error: 'В профиле не указан телефон' },
        { status: 400 }
      );
    }

    const orders = getOrdersByPhone(phone);
    return NextResponse.json({ orders });
  } catch (err) {
    console.error('CommerceML orders error:', err);
    return NextResponse.json(
      { error: err.message || 'Ошибка получения заказов' },
      { status: 500 }
    );
  }
}
```

### 5.2 API для всех заказов (админ)

Создайте `app/api/orders/1c/sync/route.js`:

```javascript
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAllOrders } from '@/lib/commerceml';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const orders = getAllOrders();
    return NextResponse.json({ orders });
  } catch (err) {
    console.error('CommerceML sync error:', err);
    return NextResponse.json(
      { error: err.message || 'Ошибка синхронизации' },
      { status: 500 }
    );
  }
}
```

---

## Шаг 6: Обновление React Hooks

### 6.1 Обновить use1COrders

Обновите `hooks/use1COrders.js`:

```javascript
import { useQuery } from '@tanstack/react-query';

export function use1COrders() {
  return useQuery({
    queryKey: ['1c-orders'],
    queryFn: async () => {
      const res = await fetch('/api/orders/1c', { credentials: 'include' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Ошибка загрузки заказов из 1С');
      }
      return res.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAll1COrders() {
  return useQuery({
    queryKey: ['1c-orders-all'],
    queryFn: async () => {
      const res = await fetch('/api/orders/1c/sync', { credentials: 'include' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Ошибка загрузки заказов из 1С');
      }
      return res.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
```

---

## Шаг 7: Обновление .env.local

```env
# CommerceML обмен (файловый)
ONE_C_EXCHANGE_DIR=C:\1C\Exchange
ONE_C_USE_COMMERCEML=true
```

---

## Шаг 8: Автоматическая выгрузка из 1С

### 8.1 Настроить расписание

В 1С:УНФ:
```
Настройки → Обмен с сайтом → Расписание
```

Установите:
- ✅ **Автоматический обмен**
- **Периодичность**: каждые 15 минут (или по расписанию)

### 8.2 Ручная выгрузка

Для тестирования нажмите:
```
Выгрузить данные → Все данные
```

---

## Шаг 9: Тестирование

### 9.1 Создать тестовый заказ в 1С

1. **Продажи → Заказы покупателей → Создать**
2. Добавьте контрагента с телефоном
3. Добавьте товары
4. Проведите документ

### 9.2 Выгрузить заказы

```
Настройки → Обмен с сайтом → Выгрузить заказы
```

### 9.3 Проверить файл

Проверьте, что файл `orders.xml` создан:
```bash
dir C:\1C\Exchange\orders.xml
```

### 9.4 Проверить на сайте

1. Авторизуйтесь на сайте
2. Укажите в профиле тот же телефон, что в 1С
3. Перейдите в "Мои заказы"
4. Должен отобразиться заказ из 1С!

---

## Чек-лист

- [ ] Настроен узел обмена в 1С
- [ ] Указан каталог `C:\1C\Exchange`
- [ ] Выгружены товары (import.xml, offers.xml)
- [ ] Выгружены заказы (orders.xml)
- [ ] Установлен `fast-xml-parser`
- [ ] Создан `lib/commerceml.js`
- [ ] Обновлены API routes
- [ ] Обновлены React hooks
- [ ] Обновлен `.env.local`
- [ ] Создан тестовый заказ в 1С
- [ ] Заказы отображаются на сайте

---

## Возможные проблемы

### Файлы не создаются

**Решение:**
- Проверьте, что каталог `C:\1C\Exchange` существует
- Проверьте права на запись
- Создайте каталог вручную

### Кодировка файлов

**Решение:**
CommerceML использует UTF-8. Если файл в другой кодировке:
```javascript
const xmlData = fs.readFileSync(file, 'utf-8');
// Или конвертируйте из windows-1251
const iconv = require('iconv-lite');
const xmlData = iconv.decode(fs.readFileSync(file), 'windows-1251');
```

### Файл пустой

**Решение:**
- Убедитесь, что в 1С есть заказы
- Проверьте фильтры даты в настройках обмена
- Попробуйте выгрузить без фильтров

---

## Альтернатива: JSON вместо XML

Если CommerceML слишком сложен, можно настроить выгрузку в JSON через внешнюю обработку 1С. Но это требует программирования в 1С.

**CommerceML — стандартный и надёжный способ для учебного проекта!**
