'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const LABELS = {
  '': 'Главная',
  products: 'Каталог',
  care: 'Уход за цветами',
  profile: 'Профиль',
  admin: 'Панель администратора',
  login: 'Вход',
  register: 'Регистрация',
  wishlist: 'Избранное',
};

const HIDDEN_PATHS = ['/login', '/register'];

async function fetchProductName(id) {
  const res = await fetch(`/api/products/${id}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.name || null;
}

export default function Breadcrumbs() {
  const pathname = usePathname();

  if (pathname === '/' || HIDDEN_PATHS.includes(pathname)) return null;

  const segments = pathname.split('/').filter(Boolean);
  const isProductPage = segments[0] === 'products' && segments.length === 2 && /^\d+$/.test(segments[1]);
  const productId = isProductPage ? segments[1] : null;

  const { data: productName } = useQuery({
    queryKey: ['breadcrumb-product', productId],
    queryFn: () => fetchProductName(productId),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const crumbs = [{ label: 'Главная', href: '/' }];

  segments.forEach((seg, i) => {
    const href = '/' + segments.slice(0, i + 1).join('/');
    if (isProductPage && i === segments.length - 1) {
      crumbs.push({ label: productName || 'Товар', href });
    } else {
      crumbs.push({ label: LABELS[seg] || seg, href });
    }
  });

  return (
    <nav className="container mx-auto px-4 py-3" aria-label="Хлебные крошки">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li key={crumb.href} className="flex items-center gap-1 min-w-0">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
              {isLast ? (
                <span className="font-medium text-foreground truncate max-w-[180px] sm:max-w-[260px] md:max-w-md">
                  {crumb.label}
                </span>
              ) : (
                <Link href={crumb.href} className="hover:text-primary transition-colors whitespace-nowrap">
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
