import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import styles from './Admin.module.css';

const TABS = ['Статистика', 'Заказы', 'Товары', 'Пользователи'];
const STATUS_OPTIONS = ['new', 'confirmed', 'delivered', 'cancelled'];
const STATUS_LABELS = { new: 'Новый', confirmed: 'Подтверждён', delivered: 'Доставлен', cancelled: 'Отменён' };
const STATUS_COLORS = { new: '#F59E0B', confirmed: '#3B82F6', delivered: '#10B981', cancelled: '#EF4444' };

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('Статистика');
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productForm, setProductForm] = useState({ name: '', description: '', price: '', unit: 'шт', emoji: '🌷', color: '#F4A7B9', image: null });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return; }
    loadAll();
  }, [user]);

  async function loadAll() {
    setLoading(true);
    const [s, o, p, u] = await Promise.all([
      api.get('/admin/stats'),
      api.get('/orders'),
      api.get('/products'),
      api.get('/admin/users'),
    ]);
    setStats(s); setOrders(o); setProducts(p); setUsers(u);
    setLoading(false);
  }

  async function updateOrderStatus(id, status) {
    await api.put(`/orders/${id}/status`, { status });
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  }

  async function deleteProduct(id) {
    if (!confirm('Удалить товар?')) return;
    await api.delete(`/products/${id}`);
    setProducts(prev => prev.filter(p => p.id !== id));
  }

  async function saveProduct(e) {
    e.preventDefault();
    let imageUrl = productForm.image;

    // Upload image if a new file was selected
    if (imageFile) {
      const fd = new FormData();
      fd.append('image', imageFile);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка загрузки фото');
      imageUrl = data.url;
    }

    const payload = { ...productForm, image: imageUrl };

    if (editingProduct) {
      const updated = await api.put(`/products/${editingProduct.id}`, payload);
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? updated : p));
    } else {
      const created = await api.post('/products', payload);
      setProducts(prev => [...prev, created]);
    }
    setShowProductForm(false);
    setEditingProduct(null);
    setProductForm({ name: '', description: '', price: '', unit: 'шт', emoji: '🌷', color: '#F4A7B9', image: null });
    setImageFile(null);
    setImagePreview(null);
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function startEdit(p) {
    setEditingProduct(p);
    setProductForm({ name: p.name, description: p.description, price: p.price, unit: p.unit, emoji: p.emoji, color: p.color, image: p.image || null });
    setImageFile(null);
    setImagePreview(p.image || null);
    setShowProductForm(true);
  }

  if (!user || user.role !== 'admin') return null;

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>🌷 Админ</div>
        {TABS.map(t => (
          <button key={t} className={`${styles.sidebarItem} ${tab === t ? styles.active : ''}`} onClick={() => setTab(t)}>
            {t === 'Статистика' && '📊 '}
            {t === 'Заказы' && '📦 '}
            {t === 'Товары' && '🌷 '}
            {t === 'Пользователи' && '👥 '}
            {t}
          </button>
        ))}
      </aside>

      <main className={styles.main}>
        {loading && <div className={styles.loading}><div className={styles.spinner} /></div>}

        {/* STATS */}
        {tab === 'Статистика' && stats && (
          <div>
            <h1 className={styles.pageTitle}>Статистика</h1>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span className={styles.statIcon}>📦</span>
                <div className={styles.statValue}>{stats.totalOrders}</div>
                <div className={styles.statLabel}>Всего заказов</div>
              </div>
              <div className={styles.statCard} style={{ '--accent-color': '#F59E0B' }}>
                <span className={styles.statIcon}>🔔</span>
                <div className={styles.statValue} style={{ color: '#F59E0B' }}>{stats.newOrders}</div>
                <div className={styles.statLabel}>Новых заказов</div>
              </div>
              <div className={styles.statCard} style={{ '--accent-color': '#10B981' }}>
                <span className={styles.statIcon}>💰</span>
                <div className={styles.statValue} style={{ color: '#10B981' }}>{stats.totalRevenue.toLocaleString()} ₽</div>
                <div className={styles.statLabel}>Выручка</div>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statIcon}>👥</span>
                <div className={styles.statValue}>{stats.totalUsers}</div>
                <div className={styles.statLabel}>Клиентов</div>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statIcon}>🌷</span>
                <div className={styles.statValue}>{stats.totalProducts}</div>
                <div className={styles.statLabel}>Товаров</div>
              </div>
            </div>

            <h2 className={styles.sectionTitle}>Последние заказы</h2>
            <div className={styles.table}>
              <div className={styles.tableHead}>
                <span>ID</span><span>Клиент</span><span>Сумма</span><span>Статус</span><span>Дата</span>
              </div>
              {orders.slice(0, 5).map(o => (
                <div className={styles.tableRow} key={o.id}>
                  <span className={styles.orderId}>#{String(o.id).slice(-6)}</span>
                  <span>{o.name}</span>
                  <span className={styles.orderTotal}>{o.total} ₽</span>
                  <span className={styles.statusBadge} style={{ color: STATUS_COLORS[o.status] }}>
                    ● {STATUS_LABELS[o.status]}
                  </span>
                  <span className={styles.dateText}>{new Date(o.createdAt).toLocaleDateString('ru-RU')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ORDERS */}
        {tab === 'Заказы' && (
          <div>
            <h1 className={styles.pageTitle}>Заказы <span className={styles.count}>{orders.length}</span></h1>
            <div className={styles.table}>
              <div className={styles.tableHead}>
                <span>ID</span><span>Клиент</span><span>Телефон</span><span>Товары</span><span>Сумма</span><span>Статус</span>
              </div>
              {orders.map(o => (
                <div className={styles.tableRow} key={o.id}>
                  <span className={styles.orderId}>#{String(o.id).slice(-6)}</span>
                  <div>
                    <div style={{ fontWeight: 500 }}>{o.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{o.address}</div>
                  </div>
                  <span style={{ fontSize: 13 }}>{o.phone}</span>
                  <div className={styles.itemsList}>
                    {o.items.map(i => <span key={i.id}>{i.name} ×{i.qty}</span>)}
                  </div>
                  <span className={styles.orderTotal}>{o.total} ₽</span>
                  <select
                    className={styles.statusSelect}
                    value={o.status}
                    onChange={e => updateOrderStatus(o.id, e.target.value)}
                    style={{ color: STATUS_COLORS[o.status] }}
                  >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PRODUCTS */}
        {tab === 'Товары' && (
          <div>
            <div className={styles.tabHeader}>
              <h1 className={styles.pageTitle}>Товары <span className={styles.count}>{products.length}</span></h1>
              <button className={styles.addBtn} onClick={() => { setEditingProduct(null); setProductForm({ name: '', description: '', price: '', unit: 'шт', emoji: '🌷', color: '#F4A7B9', image: null }); setImageFile(null); setImagePreview(null); setShowProductForm(true); }}>
                + Добавить
              </button>
            </div>

            {showProductForm && (
              <form className={styles.productForm} onSubmit={saveProduct}>
                <h3>{editingProduct ? 'Редактировать товар' : 'Новый товар'}</h3>
                <div className={styles.formGrid}>
                  <input className={styles.input} placeholder="Название" value={productForm.name}
                    onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))} required />
                  <input className={styles.input} placeholder="Цена (₽)" type="number" value={productForm.price}
                    onChange={e => setProductForm(f => ({ ...f, price: e.target.value }))} required />
                  <input className={styles.input} placeholder="Описание" value={productForm.description}
                    onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))} />
                  <select className={styles.input} value={productForm.unit}
                    onChange={e => setProductForm(f => ({ ...f, unit: e.target.value }))}>
                    <option value="шт">Штучно</option>
                    <option value="букет">Букет</option>
                  </select>
                  <input className={styles.input} placeholder="Эмодзи" value={productForm.emoji}
                    onChange={e => setProductForm(f => ({ ...f, emoji: e.target.value }))} />
                  <div className={styles.colorField}>
                    <label>Цвет карточки</label>
                    <input type="color" value={productForm.color}
                      onChange={e => setProductForm(f => ({ ...f, color: e.target.value }))} />
                  </div>
                </div>
                <div className={styles.imageUpload}>
                  <label className={styles.imageLabel}>
                    {imagePreview
                      ? <img src={imagePreview} alt="preview" className={styles.imagePreview} />
                      : <div className={styles.imagePlaceholder}><span>📷</span><span>Выбрать фото</span></div>
                    }
                    <input type="file" accept="image/*" onChange={handleImageChange} className={styles.fileInput} />
                  </label>
                  {imagePreview && (
                    <button type="button" className={styles.removeImageBtn} onClick={() => { setImageFile(null); setImagePreview(null); setProductForm(f => ({ ...f, image: null })); }}>
                      Удалить фото
                    </button>
                  )}
                </div>
                <div className={styles.formActions}>
                  <button type="submit" className={styles.saveBtn}>{editingProduct ? 'Сохранить' : 'Создать'}</button>
                  <button type="button" className={styles.cancelBtn} onClick={() => setShowProductForm(false)}>Отмена</button>
                </div>
              </form>
            )}

            <div className={styles.productsGrid}>
              {products.map(p => (
                <div className={styles.productCard} key={p.id}>
                  <div className={styles.productEmoji} style={{ background: p.color + '33' }}>{p.emoji}</div>
                  <div className={styles.productInfo}>
                    <div className={styles.productName}>{p.name}</div>
                    <div className={styles.productPrice}>{p.price} ₽ / {p.unit}</div>
                  </div>
                  <div className={styles.productActions}>
                    <button className={styles.editBtn} onClick={() => startEdit(p)}>✏️</button>
                    <button className={styles.deleteBtn} onClick={() => deleteProduct(p.id)}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* USERS */}
        {tab === 'Пользователи' && (
          <div>
            <h1 className={styles.pageTitle}>Пользователи <span className={styles.count}>{users.length}</span></h1>
            <div className={styles.table}>
              <div className={styles.tableHead}>
                <span>Имя</span><span>Email</span><span>Роль</span><span>Дата регистрации</span>
              </div>
              {users.map(u => (
                <div className={styles.tableRow} key={u.id}>
                  <div className={styles.userRow}>
                    <div className={styles.userAvatar}>{u.name[0].toUpperCase()}</div>
                    <span>{u.name}</span>
                  </div>
                  <span style={{ fontSize: 14 }}>{u.email}</span>
                  <span className={`${styles.roleBadge} ${u.role === 'admin' ? styles.adminBadge : ''}`}>
                    {u.role === 'admin' ? '👑 Админ' : '🌷 Клиент'}
                  </span>
                  <span className={styles.dateText}>{new Date(u.createdAt).toLocaleDateString('ru-RU')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
