import { useState } from 'react';
import { useCart } from '../CartContext';
import { useAuth } from '../AuthContext';
import { api } from '../api';
import styles from './Cart.module.css';

export default function Cart({ open, onClose }) {
  const { cart, changeQty, clear, total } = useCart();
  const { user } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: '', address: '' });
  const [step, setStep] = useState('cart'); // cart | form | success
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleOrder(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/orders', {
        ...form,
        userId: user?.id || null,
        items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty }))
      });
      clear();
      setStep('success');
    } catch (err) {
      alert(err.message);
    }
    setLoading(false);
  }

  function handleClose() {
    onClose();
    setTimeout(() => setStep('cart'), 300);
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
                  <button className={styles.primaryBtn} onClick={() => setStep('form')}>
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
              <input className={styles.input} placeholder="Телефон" type="tel" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
              <input className={styles.input} placeholder="Адрес доставки" value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))} required />
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
