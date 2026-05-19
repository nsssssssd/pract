'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWishlistStore } from '@/store/wishlist';
import { Home, Flower2, Heart, User } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Главная', icon: Home },
  { href: '/care', label: 'Уход', icon: Flower2 },
  { href: '/wishlist', label: 'Избранное', icon: Heart },
  { href: '/profile', label: 'Профиль', icon: User },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const wishlistCount = useWishlistStore((s) => s.count());

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-t">
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {item.href === '/wishlist' && wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                    {wishlistCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
