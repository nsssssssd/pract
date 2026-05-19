'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useCartStore } from '@/store/cart';
import { useWishlistStore } from '@/store/wishlist';
import SearchBar from './SearchBar';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Sun, Moon, LogOut, User, Shield, Heart, Search } from 'lucide-react';

export default function Header() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const count = useCartStore((s) => s.count());
  const wishlistCount = useWishlistStore((s) => s.count());
  const openCart = useCartStore((s) => s.openCart);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);



  useEffect(() => {
    setLoading(true);
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [pathname]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    router.push('/');
    router.refresh();
  }

  const navLinks = [
    { href: '/', label: 'Каталог' },
    { href: '/care', label: 'Уход за цветами' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-14 md:h-16 items-center justify-between px-4">
        <Link href="/" className="text-base md:text-xl font-bold tracking-tight text-primary truncate">
          TulpanOmsk55
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === l.href ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {l.label}
            </Link>
          ))}
          {user?.role === 'admin' && (
            <Link
              href="/admin"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === '/admin' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Админ
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-1 md:gap-2">
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-full h-9 w-9 md:h-9 md:w-9"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 md:h-5 md:w-5" /> : <Moon className="h-4 w-4 md:h-5 md:w-5" />}
            </Button>
          )}

          {/* Desktop icons */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="/wishlist">
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-full h-9 w-9"
              >
                <Heart className="h-4 w-4 md:h-5 md:w-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {wishlistCount}
                  </span>
                )}
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-9 w-9"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-4 w-4 md:h-5 md:w-5" />
            </Button>

            {count > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-full h-9 w-9"
                onClick={openCart}
              >
                <ShoppingCart className="h-4 w-4 md:h-5 md:w-5" />
                <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {count}
                </span>
              </Button>
            )}
          </div>

          {/* Desktop user */}
          {!loading && (
            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <>
                  <Link href="/profile">
                    <Button variant="ghost" size="sm" className="gap-2 rounded-full">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {user.name[0].toUpperCase()}
                      </span>
                      <span className="text-sm">{user.name}</span>
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Link href="/login">
                  <Button size="sm" className="rounded-full">Войти</Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
      <SearchBar open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
