import styles from './About.module.css';

export default function About() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.hero}>
          <span className={styles.heroEmoji}>🌷</span>
          <h1>О нас</h1>
          <p>Мы выращиваем тюльпаны с любовью с 2018 года</p>
        </div>

        <div className={styles.grid}>
          <div className={styles.card}>
            <span>🌱</span>
            <h3>Собственная ферма</h3>
            <p>Выращиваем тюльпаны в теплицах Подмосковья. Никаких посредников — только свежие цветы напрямую от производителя.</p>
          </div>
          <div className={styles.card}>
            <span>🚚</span>
            <h3>Быстрая доставка</h3>
            <p>Срезаем утром, доставляем в течение 2 часов. Цветы приедут свежими и красивыми.</p>
          </div>
          <div className={styles.card}>
            <span>💚</span>
            <h3>Экологично</h3>
            <p>Используем биоразлагаемую упаковку и минимум химии при выращивании.</p>
          </div>
          <div className={styles.card}>
            <span>🎁</span>
            <h3>Подарочное оформление</h3>
            <p>Красивая упаковка и открытка с вашим текстом — бесплатно к каждому заказу.</p>
          </div>
        </div>

        <div className={styles.contact}>
          <h2>Контакты</h2>
          <div className={styles.contactGrid}>
            <div className={styles.contactItem}><span>📞</span><div><strong>Телефон</strong><p>+7 (900) 123-45-67</p></div></div>
            <div className={styles.contactItem}><span>📧</span><div><strong>Email</strong><p>hello@tulips.ru</p></div></div>
            <div className={styles.contactItem}><span>📍</span><div><strong>Адрес</strong><p>Москва, ул. Цветочная, 1</p></div></div>
            <div className={styles.contactItem}><span>🕐</span><div><strong>Режим работы</strong><p>Ежедневно 8:00 — 22:00</p></div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
