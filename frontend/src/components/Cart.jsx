import { useState, useEffect } from 'react';
import { useCart } from '../CartContext';
import { useAuth } from '../AuthContext';
import { api } from '../api';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Cart.module.css';

export default function Cart({ open, onClose }) {
  const { cart, changeQty, clear, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', address: '', paymentMethod: 'cash' });
  const [step, setStep] = useState('cart');
  const [loading, setLoading] = useState(false);
  const [lastOrderId, setLastOrderId] = useState(null);

  // Reset form with fresh user data every time cart opens
  useEffect(() => {
    if (open) {
      setForm({ name: user?.name || '', phone: '', address: '', paymentMethod: 'cash' });
      setStep('cart');
      setLastOrderId(null);
    }
  }, [open, user]);

  if (!open) return null;

  async function handleOrder(e) {
    e.preventDefault();
    
    // Валидация телефона
    const phoneRegex = /^(\+7|8)?[\s-]?\(?[0-9]{3}\)?[\s-]?[0-9]{3}[\s-]?[0-9]{2}[\s-]?[0-9]{2}$/;
    if (!phoneRegex.test(form.phone.trim())) {
      alert('Введите корректный номер телефона (например: +79991234567 или 89991234567)');
      return;
    }
    
    // Валидация адреса
    if (form.address.trim().length < 10) {
      alert('Адрес должен содержать минимум 10 символов');
      return;
    }
    
    setLoading(true);
    try {
      const res = await api.post('/orders', {
        ...form,
        userId: user?.id || null,
        items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty }))
      });
      clear();
      setLastOrderId(res.orderId);
      setStep('success');
    } catch (err) {
      alert(err.message);
    }
    setLoading(false);
  }

  function handleClose() {
    onClose();
  }

  return (
    <>
      <div className={styles.overlay} onClick={handleClose} />
      <div className={styles.drawer}>
        <div className={styles.handle} />
        <div className={styles.header}>
          <span className={styles.title}>
            {step === 'success' ? '🎉 Заказ оформлен' : step === 'form' ? 'Оформление' : '🛒 Корзина'}
          </span>
          <button className={styles.closeBtn} onClick={handleClose}>✕</button>
        </div>

        <div className={styles.body}>
          {step === 'success' && (
            <div className={styles.success}>
              <span className={styles.successEmoji}>🌷</span>
              <div className={styles.successTitle}>Спасибо за заказ!</div>
              <div className={styles.successText}>Мы свяжемся с вами для подтверждения доставки</div>
              {lastOrderId && (
                <div className={styles.successOrderId}>
                  Заказ #{String(lastOrderId).slice(-6)}
                </div>
              )}
              {user ? (
                <Link to="/profile" className={styles.successLink} onClick={handleClose}>
                  Посмотреть мои заказы →
                </Link>
              ) : (
                <Link to="/login" className={styles.successLink} onClick={handleClose}>
                  Войдите, чтобы отслеживать заказы →
                </Link>
              )}
              <button className={styles.successBtn} onClick={handleClose}>Продолжить покупки</button>
            </div>
          )}

          {step === 'cart' && (
            <>
              {cart.length === 0 ? (
                <div className={styles.empty}>
                  <span>🛒</span>
                  <p>Корзина пуста</p>
                </div>
              ) : (
                <>
                  <div className={styles.items}>
                    {cart.map(item => (
                      <div className={styles.item} key={item.id}>
                        <div className={styles.itemEmoji} style={{ background: item.color + '33' }}>{item.emoji}</div>
                        <div className={styles.itemInfo}>
                          <div className={styles.itemName}>{item.name}</div>
                          <div className={styles.itemPrice}>{item.price * item.qty} ₽</div>
                        </div>
                        <div className={styles.qty}>
                          <button className={styles.qtyBtn} onClick={() => changeQty(item.id, -1)}>−</button>
                          <span>{item.qty}</span>
                          <button className={styles.qtyBtn} onClick={() => changeQty(item.id, 1)}>+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={styles.total}>
                    <span>Итого</span>
                    <span className={styles.totalPrice}>{total} ₽</span>
                  </div>
                  <button
                    className={styles.primaryBtn}
                    onClick={() => {
                      if (user?.role === 'admin') {
                        alert('Администраторы не могут делать покупки');
                        return;
                      }
                      if (user) {
                        setStep('form');
                      } else {
                        onClose();
                        navigate('/register');
                      }
                    }}
                  >
                    Оформить заказ →
                  </button>
                </>
              )}
            </>
          )}

          {step === 'form' && (
            <form onSubmit={handleOrder} className={styles.form}>
              <button type="button" className={styles.backBtn} onClick={() => setStep('cart')}>← Назад</button>
              <div className={styles.orderSummary}>
                {cart.map(i => <span key={i.id}>{i.emoji} {i.name} × {i.qty}</span>)}
              </div>
              <input className={styles.input} placeholder="Ваше имя" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              <input 
                className={styles.input} 
                placeholder="Телефон: +7 (999) 123-45-67" 
                type="tel" 
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} 
                required 
                pattern="(\+7|8)?[\s-]?\(?[0-9]{3}\)?[\s-]?[0-9]{3}[\s-]?[0-9]{2}[\s-]?[0-9]{2}"
                title="Введите номер в формате +79991234567 или 89991234567"
              />
              <textarea 
                className={`${styles.input} ${styles.textarea}`} 
                placeholder="Адрес доставки (улица, дом, квартира)" 
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))} 
                required 
                minLength={10}
                rows={3}
              />
              
              <div className={styles.paymentSection}>
                <label className={styles.paymentLabel}>Способ оплаты</label>
                <div className={styles.paymentOptions}>
                  <label className={`${styles.paymentOption} ${form.paymentMethod === 'cash' ? styles.selected : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={form.paymentMethod === 'cash'}
                      onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}
                    />
                    <span className={styles.paymentIcon}>💵</span>
                    <span>Наличными</span>
                  </label>
                  <label className={`${styles.paymentOption} ${form.paymentMethod === 'card' ? styles.selected : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={form.paymentMethod === 'card'}
                      onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}
                    />
                    <span className={styles.paymentIcon}>💳</span>
                    <span>По карте</span>
                  </label>
                </div>
              </div>

              <div className={styles.total} style={{ marginTop: 8 }}>
                <span>К оплате</span>
                <span className={styles.totalPrice}>{total} ₽</span>
              </div>
              <button className={styles.primaryBtn} type="submit" disabled={loading}>
                {loading ? 'Оформляем...' : `Заказать на ${total} ₽`}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
