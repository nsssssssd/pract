import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home, Search } from 'lucide-react';

export const metadata = {
  title: 'Страница не найдена',
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16 md:py-24 max-w-2xl text-center">
      <div className="text-6xl md:text-8xl mb-6">🌷</div>
      <h1 className="text-3xl md:text-5xl font-bold mb-4">Страница не найдена</h1>
      <p className="text-muted-foreground text-base md:text-lg mb-8 max-w-md mx-auto">
        К сожалению, такой страницы не существует. Возможно, товар распродан или ссылка устарела.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link href="/">
          <Button className="rounded-full gap-2">
            <Home className="h-4 w-4" />
            В каталог
          </Button>
        </Link>
        <Link href="/care">
          <Button variant="outline" className="rounded-full gap-2">
            <Search className="h-4 w-4" />
            Уход за цветами
          </Button>
        </Link>
      </div>
    </div>
  );
}
