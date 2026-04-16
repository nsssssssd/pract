const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');

const app = express();
const PORT = 3001;
const JWT_SECRET = 'tulips_secret_2026';
const DATA_FILE = path.join(__dirname, 'data.json');
const UPLOAD_DIR = path.join(__dirname, 'uploads');

// Ensure upload dir exists
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `product_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

app.use(cors());
app.use(express.json());

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(frontendDist));
}

// Always serve uploads (works in both dev and production)
app.use('/img', express.static(path.join(__dirname, 'uploads')));
// Backward compat: also serve old public/img location
app.use('/img', express.static(path.join(__dirname, '..', 'frontend', 'public', 'img')));

function readData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Нет токена' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Токен недействителен' });
  }
}

function adminMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Нет доступа' });
    next();
  });
}

// ── AUTH ──────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Заполните все поля' });

  const data = readData();
  if (data.users.find(u => u.email === email))
    return res.status(409).json({ error: 'Email уже зарегистрирован' });

  const hashed = await bcrypt.hash(password, 10);
  const user = { id: Date.now(), name, email, password: hashed, role: 'user', createdAt: new Date().toISOString() };
  data.users.push(user);
  writeData(data);

  const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const data = readData();
  const user = data.users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Неверный email или пароль' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Неверный email или пароль' });

  const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json(req.user);
});

app.put('/api/auth/profile', authMiddleware, async (req, res) => {
  const { name, email, currentPassword, newPassword } = req.body;
  const data = readData();
  // eslint-disable-next-line eqeqeq
  const userIdx = data.users.findIndex(u => u.id == req.user.id);
  if (userIdx === -1) return res.status(404).json({ error: 'Пользователь не найден' });

  const user = data.users[userIdx];

  // Check email uniqueness if changed
  if (email && email !== user.email) {
    // eslint-disable-next-line eqeqeq
    if (data.users.find(u => u.email === email && u.id != user.id))
      return res.status(409).json({ error: 'Email уже используется' });
  }

  // Password change
  if (newPassword) {
    if (!currentPassword) return res.status(400).json({ error: 'Введите текущий пароль' });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ error: 'Неверный текущий пароль' });
    if (newPassword.length < 8) return res.status(400).json({ error: 'Новый пароль минимум 8 символов' });
    user.password = await bcrypt.hash(newPassword, 10);
  }

  if (name) user.name = name;
  if (email) user.email = email;

  data.users[userIdx] = user;
  writeData(data);

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// ── UPLOAD ────────────────────────────────────────────
app.post('/api/upload', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Нет токена' });
  let user;
  try { user = jwt.verify(token, JWT_SECRET); } catch { return res.status(401).json({ error: 'Токен недействителен' }); }
  if (user.role !== 'admin') return res.status(403).json({ error: 'Нет доступа' });

  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Файл не загружен' });
    res.json({ url: `/img/${req.file.filename}` });
  });
});

// ── PRODUCTS ──────────────────────────────────────────
app.get('/api/products', (req, res) => {
  res.json(readData().products);
});

app.post('/api/products', adminMiddleware, (req, res) => {
  const { name, description, price, unit, emoji, color, image } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'Название и цена обязательны' });
  const data = readData();
  const product = { id: Date.now(), name, description: description || '', price: Number(price), unit: unit || 'шт', emoji: emoji || '🌷', color: color || '#F4A7B9', image: image || null, available: true };
  data.products.push(product);
  writeData(data);
  res.status(201).json(product);
});

app.put('/api/products/:id', adminMiddleware, (req, res) => {
  const data = readData();
  const idx = data.products.findIndex(p => p.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Товар не найден' });
  data.products[idx] = { ...data.products[idx], ...req.body, id: data.products[idx].id };
  writeData(data);
  res.json(data.products[idx]);
});

app.delete('/api/products/:id', adminMiddleware, (req, res) => {
  const data = readData();
  data.products = data.products.filter(p => p.id !== parseInt(req.params.id));
  writeData(data);
  res.json({ success: true });
});

// ── ORDERS ────────────────────────────────────────────
app.post('/api/orders', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  let user = null;
  if (token) {
    try {
      user = jwt.verify(token, JWT_SECRET);
      if (user.role === 'admin') {
        return res.status(403).json({ error: 'Администраторы не могут делать покупки' });
      }
    } catch {
      // Token invalid, continue as guest
    }
  }

  const { name, phone, address, items, userId, paymentMethod } = req.body;
  if (!name || !phone || !address || !items?.length)
    return res.status(400).json({ error: 'Заполните все поля' });
  if (!paymentMethod || !['cash', 'card'].includes(paymentMethod))
    return res.status(400).json({ error: 'Выберите способ оплаты' });

  // Валидация телефона
  const phoneRegex = /^(\+7|8)?[\s-]?\(?[0-9]{3}\)?[\s-]?[0-9]{3}[\s-]?[0-9]{2}[\s-]?[0-9]{2}$/;
  if (!phoneRegex.test(phone.trim())) {
    return res.status(400).json({ error: 'Некорректный номер телефона' });
  }

  // Валидация адреса
  if (address.trim().length < 10) {
    return res.status(400).json({ error: 'Адрес должен содержать минимум 10 символов' });
  }

  const data = readData();
  const order = {
    id: Date.now(), userId: userId || null, name, phone, address, items,
    total: items.reduce((s, i) => s + i.price * i.qty, 0),
    paymentMethod,
    status: 'new', createdAt: new Date().toISOString()
  };
  data.orders.push(order);
  writeData(data);
  res.status(201).json({ success: true, orderId: order.id });
});

app.get('/api/orders', adminMiddleware, (req, res) => {
  res.json(readData().orders.reverse());
});

app.get('/api/orders/my', authMiddleware, (req, res) => {
  const data = readData();
  // eslint-disable-next-line eqeqeq
  res.json(data.orders.filter(o => o.userId == req.user.id).reverse());
});

app.put('/api/orders/:id/status', adminMiddleware, (req, res) => {
  const { status } = req.body;
  const data = readData();
  const order = data.orders.find(o => o.id === parseInt(req.params.id));
  if (!order) return res.status(404).json({ error: 'Заказ не найден' });
  order.status = status;
  writeData(data);
  res.json(order);
});



// ── ADMIN STATS ───────────────────────────────────────
app.get('/api/admin/stats', adminMiddleware, (req, res) => {
  const data = readData();
  const orders = data.orders;
  res.json({
    totalOrders: orders.length,
    totalRevenue: orders.reduce((s, o) => s + o.total, 0),
    newOrders: orders.filter(o => o.status === 'new').length,
    totalUsers: data.users.filter(u => u.role !== 'admin').length,
    totalProducts: data.products.length
  });
});

app.get('/api/admin/users', adminMiddleware, (req, res) => {
  const data = readData();
  res.json(data.users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt })));
});

// Fallback to React app for all non-API routes (production)
if (process.env.NODE_ENV === 'production') {
  app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
  });
}

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
