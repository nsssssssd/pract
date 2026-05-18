'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full border-t bg-muted/30 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="text-lg font-bold tracking-tight text-primary">
            TulpanOmsk55
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Каталог
            </Link>
            <Link href="/care" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Уход за цветами
            </Link>
          </nav>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} TulpanOmsk55. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  );
}
