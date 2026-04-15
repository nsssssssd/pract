import { useState, useEffect } from 'react';
import { useCart } from '../CartContext';
import { api } from '../api';
import styles from './Home.module.css';

const FILTERS = ['Все', 'Штучно', 'Букеты'];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Все');
  const [added, setAdded] = useState({});
  const { add } = useCart();

  useEffect(() => {
    api.get('/products')
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  function handleAdd(p) {
    add(p);
    setAdded(a => ({ ...a, [p.id]: true }));
    setTimeout(() => setAdded(a => ({ ...a, [p.id]: false })), 800);
  }

  const filtered = products.filter(p => {
    if (filter === 'Штучно') return p.unit === 'шт';
    if (filter === 'Букеты') return p.unit === 'букет';
    return true;
  });

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>🚚 Доставка за 2 часа</div>
          <h1 className={styles.heroTitle}>Свежие тюльпаны<br />прямо с поля</h1>
          <p className={styles.heroSub}>Каждый день — новая партия. Срезаем утром, доставляем днём.</p>
          <div className={styles.heroStats}>
            <div className={styles.stat}><span>500+</span><small>довольных клиентов</small></div>
            <div className={styles.statDivider} />
            <div className={styles.stat}><span>10+</span><small>сортов тюльпанов</small></div>
            <div className={styles.statDivider} />
            <div className={styles.stat}><span>2ч</span><small>время доставки</small></div>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.heroFlowers}>
            {['🌷','🌸','🌺','💐','🌷','🌸'].map((e, i) => (
              <span key={i} className={styles.floatFlower} style={{ animationDelay: `${i * 0.4}s` }}>{e}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <div className={styles.features}>
        {[
          { icon: '🌱', title: 'Свежесть', text: 'Срезаем каждое утро' },
          { icon: '📦', title: 'Упаковка', text: 'Бережная и красивая' },
          { icon: '💳', title: 'Оплата', text: 'При получении' },
          { icon: '🎁', title: 'Открытка', text: 'Бесплатно к заказу' },
        ].map(f => (
          <div className={styles.featureCard} key={f.title}>
            <span className={styles.featureIcon}>{f.icon}</span>
            <div className={styles.featureTitle}>{f.title}</div>
            <div className={styles.featureText}>{f.text}</div>
          </div>
        ))}
      </div>

      {/* Catalog */}
      <section className={styles.catalog}>
        <div className={styles.catalogHeader}>
          <h2 className={styles.catalogTitle}>Каталог</h2>
          <div className={styles.filters}>
            {FILTERS.map(f => (
              <button key={f} className={`${styles.filterBtn} ${filter === f ? styles.active : ''}`}
                onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className={styles.loading}><div className={styles.spinner} /></div>
        ) : (
          <div className={styles.grid}>
            {filtered.map(p => (
              <div className={styles.card} key={p.id}>
                <div className={styles.cardImg} style={{ background: p.color + '28' }}>
                  {p.image
                    ? <img src={p.image} alt={p.name} className={styles.cardPhoto} />
                    : <span className={styles.cardEmoji}>{p.emoji}</span>
                  }
                  {p.unit === 'букет' && <span className={styles.cardTag}>Букет</span>}
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.cardName}>{p.name}</div>
                  <div className={styles.cardDesc}>{p.description}</div>
                  <div className={styles.cardFooter}>
                    <div>
                      <span className={styles.cardPrice}>{p.price} ₽</span>
                      <span className={styles.cardUnit}> / {p.unit}</span>
                    </div>
                    <button
                      className={`${styles.addBtn} ${added[p.id] ? styles.addedBtn : ''}`}
                      onClick={() => handleAdd(p)}
                    >
                      {added[p.id] ? '✓' : '+'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <div className={styles.ctaInner}>
          <span className={styles.ctaEmoji}>🌷</span>
          <h2>Нужен большой заказ?</h2>
          <p>Оптовые поставки, оформление мероприятий, корпоративные букеты</p>
          <a href="tel:+79081074145" className={styles.ctaBtn}>Позвонить нам</a>
        </div>
      </section>
    </div>
  );
}
