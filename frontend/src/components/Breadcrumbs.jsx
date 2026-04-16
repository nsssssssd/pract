import { Link, useLocation } from 'react-router-dom';
import styles from './Breadcrumbs.module.css';

const LABELS = {
  '':         'Главная',
  'care':     'Уход за цветами',
  'profile':  'Профиль',
  'admin':    'Панель администратора',
  'login':    'Вход',
  'register': 'Регистрация',
};

export default function Breadcrumbs() {
  const { pathname } = useLocation();

  // Don't show on home page
  if (pathname === '/') return null;

  const segments = pathname.split('/').filter(Boolean);

  const crumbs = [
    { label: 'Главная', to: '/' },
    ...segments.map((seg, i) => ({
      label: LABELS[seg] || seg,
      to: '/' + segments.slice(0, i + 1).join('/'),
    })),
  ];

  return (
    <nav className={styles.breadcrumbs} aria-label="Хлебные крошки">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={crumb.to} className={styles.item}>
            {i > 0 && (
              <svg className={styles.sep} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            )}
            {isLast ? (
              <span className={styles.current}>{crumb.label}</span>
            ) : (
              <Link to={crumb.to} className={styles.link}>{crumb.label}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
