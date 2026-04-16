import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useCart } from '../CartContext';
import styles from './Header.module.css';

export default function Header({ onCartOpen }) {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <>
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>TulpanOmsk55</Link>

        <nav className={styles.nav}>
          <Link to="/" className={styles.navLink}>Каталог</Link>
          <Link to="/care" className={styles.navLink}>Уход за цветами</Link>
          {user?.role === 'admin' && (
            <Link to="/admin" className={`${styles.navLink} ${styles.adminLink}`}>Админ</Link>
          )}
        </nav>

        {/* Right side: desktop user + cart + burger */}
        <div className={styles.actions}>
          {/* Desktop: login or user */}
          <div className={styles.desktopUser}>
            {user ? (
              <div className={styles.userMenu}>
                <Link to="/profile" className={styles.userBtn}>
                  <span className={styles.avatar}>{user.name[0].toUpperCase()}</span>
                  <span className={styles.userName}>{user.name}</span>
                </Link>
                <button className={styles.logoutBtn} onClick={handleLogout} title="Выйти">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                </button>
              </div>
            ) : (
              <Link to="/login" className={styles.loginBtn}>Войти</Link>
            )}
          </div>

          {/* Cart — always visible */}
          <button className={styles.cartBtn} onClick={onCartOpen} aria-label="Корзина">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            {count > 0 && <span className={styles.badge}>{count}</span>}
          </button>

          {/* Mobile: profile icon */}
          {user && (
            <Link to="/profile" className={styles.mobileProfileBtn} aria-label="Профиль">
              <span className={styles.mobileAvatar}>{user.name[0].toUpperCase()}</span>
            </Link>
          )}

          {/* Burger */}
          <button
            className={`${styles.burger} ${menuOpen ? styles.burgerOpen : ''}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
          >
            <span /><span /><span />
          </button>
        </div>
      </header>

      {/* Overlay */}
      <div
        className={`${styles.overlay} ${menuOpen ? styles.overlayVisible : ''}`}
        onClick={() => setMenuOpen(false)}
      />

      {/* Mobile menu */}
      <div className={`${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ''}`}>
        <div className={styles.menuUser}>
          {user ? (
            <>
              <div className={styles.menuAvatar}>{user.name[0].toUpperCase()}</div>
              <div className={styles.menuUserInfo}>
                <div className={styles.menuUserName}>{user.name}</div>
                <div className={styles.menuUserEmail}>{user.email}</div>
              </div>
            </>
          ) : (
            <div className={styles.menuGuestText}>Добро пожаловать 🌷</div>
          )}
        </div>

        <nav className={styles.menuNav}>
          <Link to="/" className={styles.menuLink}>
            <span className={styles.menuLinkIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </span>
            Каталог
          </Link>
          <Link to="/care" className={styles.menuLink}>
            <span className={styles.menuLinkIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </span>
            Уход за цветами
          </Link>
          <button className={styles.menuLink} onClick={() => { onCartOpen(); setMenuOpen(false); }}>
            <span className={styles.menuLinkIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
            </span>
            Корзина
            {count > 0 && <span className={styles.menuBadge}>{count}</span>}
          </button>
          {user && (
            <Link to="/profile" className={styles.menuLink}>
              <span className={styles.menuLinkIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </span>
              Мой профиль
            </Link>
          )}
          {user?.role === 'admin' && (
            <Link to="/admin" className={`${styles.menuLink} ${styles.menuLinkAdmin}`}>
              <span className={styles.menuLinkIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
                </svg>
              </span>
              Панель админа
            </Link>
          )}
        </nav>

        <div className={styles.menuBottom}>
          {user ? (
            <button className={styles.menuLogout} onClick={handleLogout}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Выйти
            </button>
          ) : (
            <div className={styles.menuAuthBtns}>
              <Link to="/login" className={styles.menuLoginBtn}>Войти</Link>
              <Link to="/register" className={styles.menuRegisterBtn}>Регистрация</Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
