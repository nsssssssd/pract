'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { motion, AnimatePresence } from 'framer-motion';

export default function SearchBar({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const router = useRouter();
  const addToCart = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  useEffect(() => {
    if (open) {
      setQuery('');
      setCategory('all');
      setLoading(true);
      fetch('/api/products')
        .then((r) => r.json())
        .then((data) => {
          setProducts(Array.isArray(data) ? data : data.products || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const debounceRef = useRef(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const q = query.trim().toLowerCase();
      let res = products;
      if (q) {
        res = res.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            (p.description && p.description.toLowerCase().includes(q))
        );
      }
      if (category !== 'all') {
        res = res.filter((p) =>
          category === 'bouquet' ? p.unit === 'букет' : p.unit !== 'букет'
        );
      }
      setFiltered(res);
    }, 150);
    return () => clearTimeout(debounceRef.current);
  }, [query, category, products]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex flex-col items-center pt-20 md:pt-24 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl flex flex-col gap-4"
          >
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Поиск тюльпанов и букетов..."
                  className="pl-10 pr-10 h-12 md:h-11 text-lg md:text-base rounded-full"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      inputRef.current?.focus();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    aria-label="Очистить поиск"
                  >
                    <X className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </button>
                )}
              </div>
              <Button type="button" variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={onClose} aria-label="Закрыть поиск">
                <X className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {[
                { key: 'all', label: 'Все' },
                { key: 'single', label: 'Штучно' },
                { key: 'bouquet', label: 'Букеты' },
              ].map((c) => (
                <button
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  className={`px-3 py-1.5 rounded-full text-sm md:text-xs font-medium transition-colors border ${
                    category === c.key
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted text-muted-foreground border-transparent hover:bg-accent'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{filtered.length} товаров</span>
              {query && <span>По запросу «{query}»</span>}
            </div>

            <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pb-8">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {query ? 'Ничего не найдено' : 'Начните вводить название товара'}
                </div>
              ) : (
                filtered.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-xl border p-3 hover:bg-accent transition-colors"
                  >
                    <div
                      className="h-12 w-12 rounded-lg flex items-center justify-center text-xl shrink-0"
                      style={{ background: p.color + '33' }}
                    >
                      {p.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{p.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {p.price} ₽ / {p.unit}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full h-9 w-9 p-0"
                        onClick={() => {
                          addToCart(p);
                          openCart();
                        }}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
