'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import FAQSection from '@/components/FAQSection';

const SORT_OPTIONS = [
  { value: 'default', label: 'По умолчанию' },
  { value: 'price_asc', label: 'Цена ↑' },
  { value: 'price_desc', label: 'Цена ↓' },
  { value: 'name_asc', label: 'Название А-Я' },
];

const COLORS = [
  { value: '', label: 'Все цвета' },
  { value: '#E8506A', label: 'Красный' },
  { value: '#F4A7B9', label: 'Розовый' },
  { value: '#F5F0EB', label: 'Белый' },
  { value: '#F9D56E', label: 'Жёлтый' },
  { value: '#C8E6C9', label: 'Зелёный' },
];

export default function HomePage({ initialProducts }) {
  const displayProducts = initialProducts || [];
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('default');
  const [colorFilter, setColorFilter] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let result = (displayProducts || []).filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      const matchColor = !colorFilter || p.color === colorFilter;
      const matchPriceMin = !priceMin || p.price >= Number(priceMin);
      const matchPriceMax = !priceMax || p.price <= Number(priceMax);
      return matchSearch && matchColor && matchPriceMin && matchPriceMax;
    });

    if (sort === 'price_asc') result.sort((a, b) => a.price - b.price);
    if (sort === 'price_desc') result.sort((a, b) => b.price - a.price);
    if (sort === 'name_asc') result.sort((a, b) => a.name.localeCompare(b.name));

    return result;
  }, [displayProducts, search, sort, colorFilter, priceMin, priceMax]);

  const hasActiveFilters = search || colorFilter || priceMin || priceMax;

  function clearFilters() {
    setSearch('');
    setColorFilter('');
    setPriceMin('');
    setPriceMax('');
    setSort('default');
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-12 space-y-10 md:space-y-16">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-primary/15 via-background to-background border px-4 sm:px-6 md:px-10 lg:px-16 py-8 sm:py-12 md:py-16 lg:py-20"
      >
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-6 md:gap-10 lg:gap-16">
          <div className="max-w-2xl space-y-3 md:space-y-4 lg:space-y-5 flex-1">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center rounded-full bg-primary/10 px-3 md:px-4 py-1.5 text-sm font-medium text-primary"
            >
              🚚 Доставка за 2 часа
            </motion.div>
            <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
              Свежие тюльпаны
              <br />
              <span className="text-primary">прямо с поля</span>
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-md leading-relaxed">
              Каждый день — новая партия. Срезаем утром, доставляем днём.
            </p>
            <div className="flex flex-wrap gap-3 sm:gap-4 md:gap-6 lg:gap-8 pt-1 md:pt-2">
              <div>
                <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">500+</div>
                <div className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">довольных клиентов</div>
              </div>
              <div className="w-px bg-border" />
              <div>
                <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">10+</div>
                <div className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">сортов тюльпанов</div>
              </div>
              <div className="w-px bg-border" />
              <div>
                <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">2ч</div>
                <div className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">время доставки</div>
              </div>
            </div>
          </div>

          <div className="hidden lg:block relative w-72 h-72 shrink-0">
            {/* Desktop: absolutely positioned tulips */}
            <div className="relative w-full h-full">
              {[
                { emoji: '🌷', size: 'text-6xl', left: '20%', top: '10%', delay: 0 },
                { emoji: '🌷', size: 'text-5xl', left: '65%', top: '0%', delay: 0.6 },
                { emoji: '🌷', size: 'text-7xl', left: '35%', top: '45%', delay: 1.2 },
                { emoji: '🌷', size: 'text-4xl', left: '75%', top: '55%', delay: 1.8 },
                { emoji: '🌷', size: 'text-5xl', left: '85%', top: '25%', delay: 0.3 },
                { emoji: '🌷', size: 'text-6xl', left: '10%', top: '65%', delay: 0.9 },
                { emoji: '🌷', size: 'text-4xl', left: '50%', top: '78%', delay: 1.5 },
              ].map((t, i) => (
                <motion.span
                  key={i}
                  className={`absolute ${t.size} select-none drop-shadow-lg`}
                  style={{ left: t.left, top: t.top }}
                  animate={{
                    y: [0, -12, 0],
                    rotate: [-6, 6, -6],
                    scale: [1, 1.08, 1],
                  }}
                  transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: t.delay,
                  }}
                >
                  {t.emoji}
                </motion.span>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Catalog */}
      <section>
        <div className="flex flex-col gap-4 mb-6 md:mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl md:text-4xl font-bold">Каталог</h2>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" className="gap-1 text-destructive" onClick={clearFilters}>
                  <X className="h-4 w-4" /> Сбросить
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className={`gap-1 ${showFilters ? 'bg-accent' : ''}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-4 w-4" /> Фильтры
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по названию или описанию..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-xl border bg-card animate-fade">
            
              <div className="space-y-2">
                <label className="text-sm font-medium">Сортировка</label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Цвет</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setColorFilter(c.value === colorFilter ? '' : c.value)}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm border transition-colors ${
                        colorFilter === c.value ? 'border-primary bg-primary/10' : 'border-input hover:bg-accent'
                      }`}
                    >
                      {c.value && <span className="w-3 h-3 rounded-full border" style={{ background: c.value }} />}
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Цена от</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Цена до</label>
                <Input
                  type="number"
                  placeholder="∞"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            Найдено: {filtered.length} товаров
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-lg">Ничего не найдено</p>
            <p className="text-sm">Попробуйте изменить параметры поиска или фильтры</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {filtered.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* FAQ */}
      <FAQSection />

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
