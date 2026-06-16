# План интеграции с 1С:УНФ

## Цель
Полная двусторонняя синхронизация заказов между сайтом и 1С:УНФ.

## Архитектура

### 1. Чтение заказов из 1С (уже есть)
- `GET /api/orders/1c` → `lib/1c.js` → HTTP-сервис 1С `/GetOrders?phone={phone}`
- Отображается в профиле пользователя (вкладка "1С:УНФ")

### 2. Отправка заказов в 1С (новое)
- При создании заказа на сайте (`POST /api/orders`) → отправляем в 1С
- Новый метод `lib/1c.js`: `create1COrder(orderData)`
- Новый endpoint в 1С: `/CreateOrder` (POST)

### 3. Синхронизация статусов из 1С (новое)
- Новый API: `GET /api/orders/1c/sync` (только для админа)
- Получает все заказы из 1С и обновляет статусы в `data.json`
- Новый endpoint в 1С: `/GetAllOrders` или `/GetOrderStatus?number={number}`

### 4. Отображение 1С-заказов в админке (новое)
- Новый хук: `useAll1COrders()` для админов
- Новый API: `GET /api/orders/1c/all` (админ, без фильтра по телефону)
- Обновить `AdminContent.jsx` — вкладка Orders показывает оба источника

## Файлы для изменения

### Сервер
1. `lib/1c.js` — добавить `create1COrder()`, `sync1COrderStatus()`
2. `app/api/orders/route.js` — при POST отправлять в 1С
3. `app/api/orders/1c/route.js` — добавить GET для админа (все заказы)
4. `app/api/orders/1c/sync/route.js` — новый роут для синхронизации статусов

### Клиент
5. `hooks/use1COrders.js` — добавить `useAll1COrders()`
6. `app/admin/AdminContent.jsx` — добавить вкладку/источник 1С
7. `app/profile/ProfileContent.jsx` — уже есть, возможно улучшить

## Формат данных для 1С

### CreateOrder (POST)
```json
{
  "number": "WEB-000001",
  "date": "2026-06-16T15:47:00",
  "client": {
    "name": "Иван Иванов",
    "phone": "+79001234567"
  },
  "items": [
    { "name": "Тюльпаны розовые", "quantity": 5, "price": 300, "sum": 1500 }
  ],
  "total": 1500,
  "comment": "Адрес доставки: ул. Ленина, 1"
}
```

### Ответ 1С
```json
{
  "success": true,
  "1cNumber": "ЗК-000042",
  "status": "Новый"
}
```

## Эндпоинты 1С

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/GetOrders?phone={phone}` | Получить заказы клиента (уже есть) |
| POST | `/CreateOrder` | Создать заказ в 1С |
| GET | `/GetOrderStatus?number={number}` | Получить статус заказа |
| GET | `/GetAllOrders?dateFrom={date}&dateTo={date}` | Получить все заказы (для админа) |

## Порядок реализации
1. Обновить `lib/1c.js` — добавить функции
2. Обновить `app/api/orders/route.js` — отправка в 1С
3. Создать `app/api/orders/1c/sync/route.js`
4. Обновить `app/api/orders/1c/route.js` — все заказы для админа
5. Обновить хуки
6. Обновить админку
7. Тестирование
