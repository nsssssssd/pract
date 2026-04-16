import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { api } from '../api';
import styles from './Profile.module.css';

const STATUS_LABELS = { new: 'Новый', confirmed: 'Подтверждён', delivered: 'Доставлен', cancelled: 'Отменён' };
const STATUS_COLORS = { new: '#F59E0B', confirmed: '#3B82F6', delivered: '#10B981', cancelled: '#EF4444' };

function EditProfileForm({ user, onSave, onCancel }) {
  const [form, setForm] = useState({ name: user.name, email: user.email });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Введите имя'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('Введите корректный email'); return; }
    setError('');
    setLoading(true);
    try {
      const data = await api.put('/auth/profile', { name: form.name.trim(), email: form.email.trim() });
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onSave(data); }, 1000);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className={styles.editForm}>
      {error && <div className={styles.formError}>{error}</div>}
      {success && <div className={styles.formSuccess}>Сохранено ✓</div>}
      <div className={styles.formField}>
        <label className={styles.formLabel}>Имя</label>
        <input
          className={styles.formInput}
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          required
        />
      </div>
      <div className={styles.formField}>
        <label className={styles.formLabel}>Email</label>
        <input
          className={styles.formInput}
          type="text"
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          required
        />
      </div>
      <div className={styles.formActions}>
        <button type="submit" className={styles.saveBtn} disabled={loading}>
          {loading ? 'Сохраняем...' : 'Сохранить'}
        </button>
        <button type="button" className={styles.cancelBtn} onClick={onCancel}>Отмена</button>
      </div>
    </form>
  );
}

function ChangePasswordForm({ onCancel }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.newPassword.length < 8) { setError('Новый пароль минимум 8 символов'); return; }
    if (!/[A-Za-zА-Яа-яЁё]/.test(form.newPassword)) { setError('Пароль должен содержать букву'); return; }
    if (!/\d/.test(form.newPassword)) { setError('Пароль должен содержать цифру'); return; }
    if (form.newPassword !== form.confirmPassword) { setError('Пароли не совпадают'); return; }
    setError('');
    setLoading(true);
    try {
      await api.put('/auth/profile', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setSuccess(true);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => { setSuccess(false); onCancel(); }, 1200);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className={styles.editForm}>
      {error && <div className={styles.formError}>{error}</div>}
      {success && <div className={styles.formSuccess}>Пароль изменён ✓</div>}
      <div className={styles.formField}>
        <label className={styles.formLabel}>Текущий пароль</label>
        <input
          className={styles.formInput}
          type="password"
          value={form.currentPassword}
          onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))}
          required
        />
      </div>
      <div className={styles.formField}>
        <label className={styles.formLabel}>Новый пароль</label>
        <input
          className={styles.formInput}
          type="password"
          placeholder="Минимум 8 символов, буква и цифра"
          value={form.newPassword}
          onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
          required
        />
      </div>
      <div className={styles.formField}>
        <label className={styles.formLabel}>Повторите новый пароль</label>
        <input
          className={styles.formInput}
          type="password"
          value={form.confirmPassword}
          onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
          required
        />
      </div>
      <div className={styles.formActions}>
        <button type="submit" className={styles.saveBtn} disabled={loading}>
          {loading ? 'Меняем...' : 'Изменить пароль'}
        </button>
        <button type="button" className={styles.cancelBtn} onClick={onCancel}>Отмена</button>
      </div>
    </form>
  );
}

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState(null); // null | 'edit' | 'password'

  useEffect(() => {
    if (user?.role === 'admin') { setLoading(false); return; }
    api.get('/orders/my')
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [user]);

  function handleProfileSaved(data) {
    updateUser(data.token, data.user);
    setActivePanel(null);
  }

  if (!user) return null;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Profile card */}
        <div className={styles.profileCard}>
          <div className={styles.avatar}>{user.name[0].toUpperCase()}</div>
          <div className={styles.profileInfo}>
            <div className={styles.name}>{user.name}</div>
            <div className={styles.email}>{user.email}</div>
          </div>
          <div className={styles.profileRight}>
            <div className={styles.roleBadge}>{user.role === 'admin' ? '👑 Админ' : '🌷 Клиент'}</div>
            <div className={styles.profileBtns}>
              <button
                className={`${styles.editBtn} ${activePanel === 'edit' ? styles.editBtnActive : ''}`}
                onClick={() => setActivePanel(p => p === 'edit' ? null : 'edit')}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Редактировать
              </button>
              <button
                className={`${styles.editBtn} ${activePanel === 'password' ? styles.editBtnActive : ''}`}
                onClick={() => setActivePanel(p => p === 'password' ? null : 'password')}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Сменить пароль
              </button>
            </div>
          </div>
        </div>

        {/* Edit panels */}
        {activePanel === 'edit' && (
          <div className={styles.panelCard}>
            <div className={styles.panelTitle}>Редактировать профиль</div>
            <EditProfileForm
              user={user}
              onSave={handleProfileSaved}
              onCancel={() => setActivePanel(null)}
            />
          </div>
        )}

        {activePanel === 'password' && (
          <div className={styles.panelCard}>
            <div className={styles.panelTitle}>Смена пароля</div>
            <ChangePasswordForm onCancel={() => setActivePanel(null)} />
          </div>
        )}

        {/* Orders — only for regular users */}
        {user.role !== 'admin' && (
          <>
            <h2 className={styles.sectionTitle}>Мои заказы</h2>

            {loading ? (
              <div className={styles.loading}><div className={styles.spinner} /></div>
            ) : orders.length === 0 ? (
              <div className={styles.empty}>
                <span>📦</span>
                <p>Заказов пока нет</p>
              </div>
            ) : (
              <div className={styles.orders}>
                {orders.map(o => (
                  <div className={styles.orderCard} key={o.id}>
                    <div className={styles.orderHeader}>
                      <span className={styles.orderId}>Заказ #{String(o.id).slice(-6)}</span>
                      <span className={styles.orderStatus} style={{ color: STATUS_COLORS[o.status] }}>
                        ● {STATUS_LABELS[o.status] || o.status}
                      </span>
                    </div>
                    <div className={styles.orderItems}>
                      {o.items.map(i => (
                        <span key={i.id} className={styles.orderItem}>{i.name} × {i.qty}</span>
                      ))}
                    </div>
                    <div className={styles.orderFooter}>
                      <span className={styles.orderDate}>{new Date(o.createdAt).toLocaleDateString('ru-RU')}</span>
                      <span className={styles.orderTotal}>{o.total} ₽</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
