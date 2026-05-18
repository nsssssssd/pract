'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useCartStore } from '@/store/cart';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, ShoppingCart, Sun, Moon, LogOut, User, Shield } from 'lucide-react';

export default function Header() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const count = useCartStore((s) => s.count());
  const openCart = useCartStore((s) => s.openCart);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
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
        <Link href="/" className="text-lg md:text-xl font-bold tracking-tight text-primary">
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
              className="rounded-full h-10 w-10 md:h-9 md:w-9"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full h-10 w-10 md:h-9 md:w-9"
            onClick={openCart}
          >
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </Button>

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

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger className="md:hidden inline-flex items-center justify-center rounded-full h-10 w-10 hover:bg-accent transition-colors">
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col gap-6 mt-6">
                <div className="flex items-center gap-3">
                  {user ? (
                    <>
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
                        {user.name[0].toUpperCase()}
                      </span>
                      <div>
                        <div className="text-base font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </>
                  ) : (
                    <div className="text-base text-muted-foreground">Добро пожаловать 🌷</div>
                  )}
                </div>

                <nav className="flex flex-col gap-1">
                  {navLinks.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className="flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium hover:bg-accent"
                    >
                      {l.label}
                    </Link>
                  ))}
                  {user?.role === 'admin' && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium hover:bg-accent text-primary"
                    >
                      <Shield className="h-5 w-5" />
                      Панель админа
                    </Link>
                  )}
                  {user && (
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium hover:bg-accent"
                    >
                      <User className="h-5 w-5" />
                      Мой профиль
                    </Link>
                  )}
                </nav>

                <div className="mt-auto">
                  {user ? (
                    <Button variant="outline" className="w-full gap-2 py-5 text-base" onClick={handleLogout}>
                      <LogOut className="h-5 w-5" />
                      Выйти
                    </Button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Link href="/login" className="w-full">
                        <Button className="w-full py-5 text-base">Войти</Button>
                      </Link>
                      <Link href="/register" className="w-full">
                        <Button variant="outline" className="w-full py-5 text-base">Регистрация</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
