import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useCart } from '../CartContext';
import styles from './Header.module.css';

export default function Header({ onCartOpen }) {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.logo}>
        <span>🌷</span> Тюльпаны
      </Link>

      <nav className={styles.nav}>
        <Link to="/" className={styles.navLink}>Каталог</Link>
        <Link to="/about" className={styles.navLink}>О нас</Link>
        {user?.role === 'admin' && <Link to="/admin" className={styles.navLink + ' ' + styles.adminLink}>Админ</Link>}
      </nav>

      <div className={styles.actions}>
        <button className={styles.cartBtn} onClick={onCartOpen} aria-label="Корзина">
          <span>🛒</span>
          {count > 0 && <span className={styles.badge}>{count}</span>}
        </button>
        {user ? (
          <div className={styles.userMenu}>
            <Link to="/profile" className={styles.userBtn}>
              <span className={styles.avatar}>{user.name[0].toUpperCase()}</span>
              <span className={styles.userName}>{user.name}</span>
            </Link>
            <button className={styles.logoutBtn} onClick={handleLogout} title="Выйти">↩</button>
          </div>
        ) : (
          <Link to="/login" className={styles.loginBtn}>Войти</Link>
        )}
      </div>
    </header>
  );
}
