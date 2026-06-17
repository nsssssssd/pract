# Промпт для реализации модуля импорта прайсов

## Назначение
Реализовать модуль автоматического импорта каталога товаров из прайс-файлов для интернет-магазина цветов **TulpanOmsk55** (Next.js 16, React 19, JSON-хранилище).

## Контекст проекта

- **Фреймворк:** Next.js 16.2.6 (App Router, API Routes)
- **Фронтенд:** React 19, Tailwind CSS 4, shadcn/ui
- **Хранилище:** Файловое JSON (`data.json`) — без MySQL/PostgreSQL
- **Каталог товаров:** хранится в `data.json` в поле `products` (см. структуру ниже)
- **Загрузки:** файлы сохраняются в `public/uploads/`
- **Авторизация:** JWT через cookie, роли `admin` / `user`
- **1С-интеграция:** уже реализована (`lib/1c.js`, `lib/commerceml.js`) — не трогать
- **Админ-панель:** `app/admin/` — нужно добавить туда вкладку импорта
- **Окружение:** `.env.local` (переменные читаются через `process.env`)

### Структура товара в `data.json`

```json
{
  "id": 1234567890123,
  "name": "Красные тюльпаны",
  "description": "Классические алые тюльпаны",
  "price": 150,
  "unit": "шт",
  "emoji": "🌷",
  "color": "#E8506A",
  "image": "/uploads/product_1234567890.jpg",
  "available": true,
  "category": "",
  "article": "",
  "quantity": 0
}
```

### Структура проекта (релевантная)

```
├── app/
│   ├── admin/
│   │   ├── page.jsx          — серверная страница (редирект не-админов)
│   │   └── AdminContent.jsx  — клиентская панель (вкладки: stats, orders, products, users)
│   ├── api/
│   │   ├── upload/route.js   — загрузка изображений (multipart/form-data)
│   │   ├── products/route.js — GET/POST товаров
│   │   └── products/[id]/route.js — PUT/DELETE товара
│   └── profile/
├── lib/
│   ├── db.js                 — readData() / writeData() для data.json
│   ├── auth.js               — getCurrentUser(), JWT
│   └── 1c.js                 — интеграция с 1С (не трогать)
├── data.json                 — единый JSON-файл (products, orders, users, ...)
├── public/uploads/           — загруженные файлы
└── .env.local                — переменные окружения
```

---

## 1. Модуль парсинга (`lib/priceParser.js`)

### Поддерживаемые форматы

- **CSV** — разделители `;`, `\t`, `,` (автоопределение), кодировки UTF-8 и Windows-1251
- **XLSX** — через встроенные `Node.js` модули: распаковка ZIP + парсинг XML (без внешних библиотек типа `xlsx` или `exceljs`)
- **XLS (BIFF8, Excel 97–2003)** — собственный бинарный парсер OLE2/BIFF8 на чистом JavaScript
- **Fallback для XLS** — если бинарный парсер не сработал: попытка найти HTML-таблицу внутри файла, затем парсинг как delimited-текст

### Единая точка входа

```js
/**
 * Парсит загруженный прайс-файл и возвращает массив товаров.
 * @param {string} filePath — абсолютный путь к файлу
 * @param {string} extension — расширение файла (.csv, .xlsx, .xls)
 * @returns {Promise<Array<Object>>} — массив объектов товаров
 */
export async function parseUploadedPriceFile(filePath, extension) {
  // по расширению вызывает нужный парсер
}
```

### Маппинг колонок (`convertRowsToProducts`)

Первая строка — заголовки, нормализуются через `normalizeHeaderName()`:

| Русские варианты | Английские варианты | Поле в JSON |
|---|---|---|
| артикул, арт., код | article, sku, code, id | `article` |
| наименование, название, товар | name, title, product | `name` |
| категория, раздел, группа | category, group, section | `category` |
| цена, стоимость, розница | price, cost, amount | `price` |
| количество, остаток, наличие | quantity, stock, count, qty, available | `quantity` |
| описание, примечание | description, note, comment | `description` |
| фото, изображение, картинка | photo, image, picture, img, url | `image` |
| единица, ед.изм | unit, units, measure | `unit` |
| цвет, оттенок | color, colour, tint | `color` |
| доступен, активен, статус | available, active, status, enabled | `available` |

Если **заголовков нет** — автоматически применяется формат по умолчанию (минимальный):

```
0: article, 1: name, 2: price, 3: quantity, 4: unit, 5: description, 6: image, 7: color
```

### Нормализация данных

- `normalizeName()` — обрезать пробелы, первая буква заглавная
- `normalizePrice()` — убрать пробелы, запятую заменить на точку, привести к `Number`, если не число — `0`
- `normalizeQuantity()` — привести к `Number`, если не число — `0`
- `normalizeUnit()` — если пусто, подставить `"шт"`
- `normalizeColor()` — если пусто, подставить `"#F4A7B9"` (стандартный розовый для тюльпанов)
- `normalizeImage()` — если URL относительный (`/uploads/...`), оставить как есть; если абсолютный HTTP — оставить; если пусто — `null`
- `normalizeAvailable()` — `"да"`, `"yes"`, `"1"`, `"true"`, `"+"` → `true`; `"нет"`, `"no"`, `"0"`, `"false"`, `"-"` → `false`; по умолчанию `true` если quantity > 0
- `cleanDescription()` — убрать `\n`, лишние запятые, служебный текст
- Если `name` пустое, но есть `article` — собрать `name` из `article` + `" — тюльпан"`
- Если `name` пустое и `article` пустое — пропустить строку (товар без названия не валиден)

### Структура одной позиции (результат парсинга)

```json
{
  "id": 1234567890123,
  "article": "TUL-001",
  "name": "Красные тюльпаны",
  "description": "Классические алые тюльпаны",
  "price": 150,
  "unit": "шт",
  "emoji": "🌷",
  "color": "#E8506A",
  "image": "/uploads/product_1234567890.jpg",
  "available": true,
  "category": "Тюльпаны",
  "quantity": 100
}
```

`id` генерируется как `Date.now()` + случайный суффикс при записи в каталог.
`emoji` подбирается по ключевым словам в названии (тюльпан → 🌷, роза → 🌹, букет → 💐 и т.д.) или оставляется `"🌷"` по умолчанию.

---

## 2. Ручная загрузка через админку

### API endpoint: `app/api/admin/import/route.js`

```js
// POST /api/admin/import
// Content-Type: multipart/form-data
// Поле: price_file
// Query param: ?mode=replace|append (по умолчанию append)
```

**Требования:**
- Допустимые расширения: `.xls`, `.xlsx`, `.csv`
- Максимальный размер: 100 МБ
- Только для `admin` (проверка `getCurrentUser()`)
- Файл сохраняется в `public/uploads/prices/` с именем `{safe_name}_{Ymd_His}.{ext}`
- Лимит: не более 10 файлов в `public/uploads/prices/` (старые удалять автоматически)
- Режимы:
  - `replace` — полная замена массива `products` в `data.json`
  - `append` — добавление к существующим с дедупликацией по `article` (при дубликате оставлять новую версию; если `article` пустой — дедупликация по `name`)
- После парсинга — `writeData()` и ответ с результатом:
  ```json
  { "success": true, "imported": 42, "updated": 5, "skipped": 0, "errors": [] }
  ```

### UI: вкладка «Импорт» в `app/admin/AdminContent.jsx`

Добавить в `<TabsList>` новый таб `import` (рядом с `users`):

```jsx
<TabsTrigger value="import">Импорт</TabsTrigger>
```

Содержимое вкладки:
- Заголовок: «Импорт прайсов»
- Форма загрузки файла (drag & drop или `<input type="file" accept=".csv,.xls,.xlsx" />`)
- Переключатель режима: «Заменить каталог» / «Добавить к существующему»
- Кнопка «Загрузить и импортировать»
- Прогресс/спиннер во время загрузки
- Результат: сколько импортировано, обновлено, пропущено, ошибки
- Список последних загруженных файлов (из `public/uploads/prices/`) с датой и возможностью удалить
- Примечание: «Поддерживаемые форматы: CSV, XLSX, XLS (Excel 97–2003). Максимум 100 МБ.»

---

## 3. Автоматическая подгрузка по URL (cron)

### API endpoint: `app/api/admin/import/cron/route.js`

```js
// GET /api/admin/import/cron?key=CRON_SECRET_KEY
// или POST /api/admin/import/cron?key=CRON_SECRET_KEY
```

**Источники данных** (массив внутри скрипта, редактируется в коде):

```js
const SOURCES = [
  { url: 'https://поставщик-1.ru/price.xlsx', name: 'Supplier1', format: 'xlsx' },
  { url: 'https://поставщик-2.ru/price.csv',  name: 'Supplier2', format: 'csv' },
  // можно несколько источников
];
```

**Логика:**
- Проверка `key` против `process.env.CRON_SECRET_KEY` — без ключа `403`
- Для каждого источника:
  1. Скачать файл через `fetch()` (Node.js 18+ native fetch):
     - `redirect: 'follow'`
     - таймаут 300 сек (через `AbortController`)
     - 3 попытки с паузой 5 сек
     - `User-Agent: Mozilla/5.0 (TulpanOmsk55 Bot)`
  2. Сохранить как `{name}_{Ymd_His}.{ext}` в `public/uploads/prices/`
  3. Распарсить через `parseUploadedPriceFile()`
- Объединить все позиции, дедупликация по `article` (последний источник побеждает)
- Сохранить в `data.json` через `writeData()`
- Очистка старых файлов: оставлять последние 5 файлов на каждый префикс источника
- Логирование в `data/cron-import.log` (JSON-строки, ротация при > 1 МБ)
- Ответ:
  ```json
  { "success": true, "sources": 2, "imported": 150, "updated": 10, "log": "..." }
  ```

### Запуск

- **CLI:** `node -e "require('./app/api/admin/import/cron/route.js')"` — не подходит для App Router
- **HTTP:** `curl "https://tulpanomsk55.ru/api/admin/import/cron?key=$CRON_SECRET_KEY"`
- **Cron:** ежедневно в 19:00 (настраиваемое время через `CRON_SCHEDULE` в `.env`)
- **Linux:** `0 19 * * * curl -s "https://tulpanomsk55.ru/api/admin/import/cron?key=CRON_SECRET_KEY"`
- **Windows Task Scheduler:** через `setup-windows-task.bat` (в корне проекта)
- **Ручной запуск из админки:** кнопка «Запустить обновление сейчас» на вкладке «Импорт»

### UI: кнопка ручного запуска в админке

На вкладке «Импорт» добавить:
- Кнопка «🔄 Запустить cron-обновление»
- При клике: `fetch('/api/admin/import/cron?key=' + CRON_SECRET_KEY)` — ключ не показывать пользователю, использовать серверный прокси
- Лучше: `POST /api/admin/import/cron/trigger` (только для admin, ключ берётся из `.env` на сервере)
- Результат: toast с количеством импортированных товаров

---

## 4. Админ-панель: управление импортом

### Добавить в `app/admin/AdminContent.jsx`

Новая вкладка `import` с компонентом `ImportTab`:

```jsx
function ImportTab() {
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState('append');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  // загрузка истории файлов при монтировании
  // ручная загрузка файла
  // ручной запуск cron
  // отображение результата и ошибок
}
```

### Функции на сервере (API Routes)

| Endpoint | Метод | Описание |
|---|---|---|
| `/api/admin/import` | POST | Загрузка и импорт файла (multipart) |
| `/api/admin/import/cron` | GET | Cron-запуск с ключом |
| `/api/admin/import/cron/trigger` | POST | Ручной запуск cron (только admin) |
| `/api/admin/import/history` | GET | Список загруженных файлов |
| `/api/admin/import/history` | DELETE | Удалить файл по имени |

---

## 5. Прокси изображений (опционально)

Если фото в прайсе по HTTP, а сайт на HTTPS:

```js
// app/api/proxy-image/route.js
// GET /api/proxy-image?url=https://...
```

- Валидация URL по whitelist (только разрешённые домены поставщиков)
- Кэш в `public/uploads/imgcache/` на 7 суток
- Если файл есть в кэше и не старше 7 дней — отдать из кэша
- Если нет — скачать, сохранить, отдать
- Ограничение: только изображения (Content-Type начинается с `image/`)

---

## 6. Требования к окружению

- **Node.js:** 18+ (нативный `fetch`, `AbortController`)
- **PHP не используется** — весь проект на JavaScript/TypeScript (Next.js)
- **Права на запись:** `data/`, `public/uploads/prices/`, `public/uploads/imgcache/`, `data/cron-import.log`
- **Переменные в `.env.local`:**
  ```
  CRON_SECRET_KEY=your-secret-key-here
  CRON_SCHEDULE=0 19 * * *
  MAX_PRICE_FILE_SIZE=104857600
  PRICE_UPLOAD_DIR=public/uploads/prices
  IMAGE_CACHE_DIR=public/uploads/imgcache
  ```

---

## 7. Что НЕ нужно менять

- Остальной функционал сайта (каталог, корзина, оформление заказов, SEO, 1С-интеграция) — не трогать
- Существующие API routes (`/api/orders/*`, `/api/auth/*`, `/api/products/*` без импорта)
- Существующие страницы (`app/page.jsx`, `app/profile/*`, `app/care/*`)
- Существующие хуки и компоненты

**Нужно только:**
1. Создать `lib/priceParser.js` — парсеры CSV/XLSX/XLS
2. Создать API routes для импорта (`app/api/admin/import/*`)
3. Добавить вкладку «Импорт» в `app/admin/AdminContent.jsx`
4. Добавить переменные в `.env.local` (пользователь добавит сам)

---

## 8. Референсные файлы из существующего проекта

Скопировать и адаптировать логику из:

- `lib/db.js` — `readData()` / `writeData()` для работы с JSON
- `lib/auth.js` — `getCurrentUser()` для проверки прав
- `app/api/upload/route.js` — загрузка файлов (multipart, валидация, сохранение)
- `app/api/products/route.js` — GET/POST товаров (структура данных)
- `app/admin/AdminContent.jsx` — UI админки (Tabs, Table, Dialog, toast)
- `app/api/orders/1c/sync/route.js` — пример cron-подобного endpoint'а

### При адаптации заменить:

- URL источников в `SOURCES` (массив в `app/api/admin/import/cron/route.js`)
- Путь к JSON-файлу каталога — уже `data.json` через `lib/db.js`
- Whitelist для прокси фото (если другой сервер изображений)
- Название бренда/сайта в UI — «TulpanOmsk55»
- Структуру товара — адаптировать под `data.json` (поля `emoji`, `color`, `unit`)

---

## 9. Пример использования

### Ручной импорт
1. Админ заходит в `/admin`
2. Переходит на вкладку «Импорт»
3. Выбирает файл `.xlsx` или `.csv`
4. Выбирает режим «Добавить к существующему»
5. Нажимает «Загрузить»
6. Видит результат: «Импортировано 42, обновлено 5»

### Автоматический импорт
1. Настроить cron: `0 19 * * * curl -s "https://tulpanomsk55.ru/api/admin/import/cron?key=CRON_SECRET_KEY"`
2. Каждый день в 19:00 сайт автоматически скачивает прайсы, обновляет каталог
3. Лог пишется в `data/cron-import.log`

---

## 10. Проверка после реализации

- [ ] Загрузка CSV (UTF-8) — успешно импортирует товары
- [ ] Загрузка CSV (Windows-1251) — успешно импортирует товары
- [ ] Загрузка XLSX — успешно импортирует товары
- [ ] Загрузка XLS (Excel 97–2003) — успешно импортирует товары
- [ ] Режим «replace» — полностью заменяет каталог
- [ ] Режим «append» — добавляет новые, обновляет существующие по `article`
- [ ] Дедупликация по `article` работает корректно
- [ ] Cron endpoint с правильным ключом — возвращает 200 + результат
- [ ] Cron endpoint без ключа — возвращает 403
- [ ] Ручной запуск из админки — работает
- [ ] Лог ротируется при превышении 1 МБ
- [ ] Не более 10 файлов в `uploads/prices/`
- [ ] Админка не ломается, остальные вкладки работают
