'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ProductCard';
import Loader from '@/components/Loader';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const FILTERS = ['Все', 'Штучно', 'Букеты'];

export default function HomePage() {
  const { data: products, isLoading } = useProducts();
  const [filter, setFilter] = useState('Все');

  const filtered = (products || []).filter((p) => {
    if (filter === 'Штучно') return p.unit === 'шт';
    if (filter === 'Букеты') return p.unit === 'букет';
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-6 md:py-12 space-y-10 md:space-y-16">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-primary/15 via-background to-background border px-5 py-10 md:px-16 md:py-20"
      >
        <div className="relative z-10 max-w-2xl space-y-4 md:space-y-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center rounded-full bg-primary/10 px-3 md:px-4 py-1.5 text-sm font-medium text-primary"
          >
            🚚 Доставка за 2 часа
          </motion.div>
          <h1 className="text-3xl md:text-6xl font-bold tracking-tight leading-[1.1]">
            Свежие тюльпаны
            <br />
            <span className="text-primary">прямо с поля</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-md leading-relaxed">
            Каждый день — новая партия. Срезаем утром, доставляем днём.
          </p>
          <div className="flex gap-4 md:gap-8 pt-1 md:pt-2">
            <div>
              <div className="text-xl md:text-3xl font-bold">500+</div>
              <div className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">довольных клиентов</div>
            </div>
            <div className="w-px bg-border" />
            <div>
              <div className="text-xl md:text-3xl font-bold">10+</div>
              <div className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">сортов тюльпанов</div>
            </div>
            <div className="w-px bg-border" />
            <div>
              <div className="text-xl md:text-3xl font-bold">2ч</div>
              <div className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">время доставки</div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Catalog */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4 mb-6 md:mb-8">
          <h2 className="text-2xl md:text-4xl font-bold">Каталог</h2>
          <div className="flex gap-2">
            {FILTERS.map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                size="sm"
                className="rounded-full px-4 md:px-5 text-sm md:text-base"
                onClick={() => setFilter(f)}
              >
                {f}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-72 md:h-80 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {filtered.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="rounded-2xl md:rounded-3xl bg-muted px-5 py-10 md:px-12 md:py-12 text-center space-y-4 md:space-y-5"
      >
        <div className="text-4xl md:text-5xl">🌷</div>
        <h2 className="text-2xl md:text-4xl font-bold">Нужен большой заказ?</h2>
        <p className="text-muted-foreground max-w-md mx-auto text-base md:text-lg">
          Оптовые поставки, оформление мероприятий, корпоративные букеты
        </p>
        <a href="tel:+79081074145">
          <Button size="lg" className="rounded-full mt-1 md:mt-2 px-6 md:px-8 text-base">
            Позвонить нам
          </Button>
        </a>
      </motion.section>
    </div>
  );
}
