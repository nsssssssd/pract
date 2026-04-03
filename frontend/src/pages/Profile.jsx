import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { api } from '../api';
import styles from './Profile.module.css';

const STATUS_LABELS = { new: 'Новый', confirmed: 'Подтверждён', delivered: 'Доставлен', cancelled: 'Отменён' };
const STATUS_COLORS = { new: '#F59E0B', confirmed: '#3B82F6', delivered: '#10B981', cancelled: '#EF4444' };

export default function Profile() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/my')
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.profileCard}>
          <div className={styles.avatar}>{user.name[0].toUpperCase()}</div>
          <div>
            <div className={styles.name}>{user.name}</div>
            <div className={styles.email}>{user.email}</div>
          </div>
          <div className={styles.roleBadge}>{user.role === 'admin' ? '👑 Админ' : '🌷 Клиент'}</div>
        </div>

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
      </div>
    </div>
  );
}
