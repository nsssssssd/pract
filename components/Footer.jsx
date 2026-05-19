'use client';

import Link from 'next/link';
import { MapPin, Phone, Clock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t bg-muted/30 mt-auto">
      <div className="container mx-auto px-4 py-10 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Brand */}
          <div className="space-y-3">
            <Link href="/" className="text-lg font-bold tracking-tight text-primary">
              TulpanOmsk55
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Свежие тюльпаны с доставкой по Омску. Срезаем утром — доставляем днём.
            </p>
          </div>

          {/* Nav */}
          <div className="space-y-3">
            <div className="text-sm font-semibold">Навигация</div>
            <nav className="flex flex-col gap-2">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Каталог
              </Link>
              <Link href="/care" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Уход за цветами
              </Link>
              <Link href="/wishlist" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Избранное
              </Link>
            </nav>
          </div>

          {/* Contacts */}
          <div className="space-y-3">
            <div className="text-sm font-semibold">Контакты</div>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Омск, Россия</span>
              </div>
              <a
                href="tel:+79081074145"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Phone className="h-4 w-4 shrink-0" />
                <span>+7 (908) 107-41-45</span>
              </a>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Ежедневно: 08:00 — 22:00</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 md:mt-10 pt-6 md:pt-8 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} TulpanOmsk55. Все права защищены.
          </p>
          <p className="text-xs text-muted-foreground">
            Доставка свежих тюльпанов по Омску
          </p>
        </div>
      </div>
    </footer>
  );
}
