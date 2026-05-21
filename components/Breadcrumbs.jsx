'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

const LABELS = {
  '': 'Главная',
  care: 'Уход за цветами',
  profile: 'Профиль',
  admin: 'Панель администратора',
  login: 'Вход',
  register: 'Регистрация',
  wishlist: 'Избранное',
};

const HIDDEN_PATHS = ['/login', '/register'];

export default function Breadcrumbs() {
  const pathname = usePathname();

  if (pathname === '/' || HIDDEN_PATHS.includes(pathname)) return null;

  const segments = pathname.split('/').filter(Boolean);

  const crumbs = [
    { label: 'Главная', href: '/' },
    ...segments.map((seg, i) => ({
      label: LABELS[seg] || seg,
      href: '/' + segments.slice(0, i + 1).join('/'),
    })),
  ];

  return (
    <nav className="container mx-auto px-4 py-3" aria-label="Хлебные крошки">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li key={crumb.href} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
              {isLast ? (
                <span className="font-medium text-foreground">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="hover:text-primary transition-colors">
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
