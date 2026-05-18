'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCartStore } from '@/store/cart';
import { useWishlistStore } from '@/store/wishlist';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ShoppingCart, Heart, Check, Home, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useState, useCallback } from 'react';

export default function ProductPageClient({ product }) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const toggleItem = useWishlistStore((s) => s.toggleItem);
  const isInWishlist = useWishlistStore(useCallback((s) => s.isInWishlist(product.id), [product.id]));
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 800);
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-10 max-w-5xl">
      {/* Breadcrumbs */}
      <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground mb-6 md:mb-8" aria-label="Breadcrumb">
        <Link href="/" className="flex items-center gap-1 hover:text-foreground transition-colors">
          <Home className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Главная</span>
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/" className="hover:text-foreground transition-colors">
          Каталог
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium truncate max-w-[200px] md:max-w-md">
          {product.name}
        </span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="overflow-hidden border-0 shadow-sm">
            <div
              className="relative aspect-square md:aspect-[4/3] flex items-center justify-center"
              style={{ background: product.color + '22' }}
            >
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <span className="text-8xl md:text-9xl select-none">{product.emoji}</span>
              )}
              {product.unit === 'букет' && (
                <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground text-sm px-3 py-1">
                  Букет
                </Badge>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-col gap-4 md:gap-5"
        >
          <div>
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight">{product.name}</h1>
            <p className="text-muted-foreground mt-2 md:mt-3 text-base md:text-lg leading-relaxed">
              {product.description}
            </p>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-bold">{product.price} ₽</span>
            <span className="text-muted-foreground text-lg">/ {product.unit}</span>
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            <Button
              type="button"
              size="lg"
              className="rounded-full gap-2 flex-1 md:flex-none h-12 md:h-11 text-base"
              onClick={handleAdd}
              variant={added ? 'secondary' : 'default'}
            >
              {added ? <Check className="h-5 w-5" aria-hidden="true" /> : <ShoppingCart className="h-5 w-5" aria-hidden="true" />}
              {added ? 'Добавлено' : 'В корзину'}
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="rounded-full gap-2 h-12 md:h-11 text-base"
              onClick={() => toggleItem(product)}
              aria-label={isInWishlist ? 'Удалить из избранного' : 'Добавить в избранное'}
            >
              <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-red-500 text-red-500' : ''}`} aria-hidden="true" />
              {isInWishlist ? 'В избранном' : 'В избранное'}
            </Button>
          </div>

          <Card className="border-0 shadow-sm bg-muted/50 mt-2">
            <CardContent className="p-4 md:p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-600 font-medium">✓</span>
                <span>Доставка за 2 часа по Омску</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-600 font-medium">✓</span>
                <span>Свежие тюльпаны каждый день</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-600 font-medium">✓</span>
                <span>Оплата наличными или картой</span>
              </div>
            </CardContent>
          </Card>

          <Link href="/">
            <Button variant="ghost" className="gap-2 w-fit text-sm mt-2">
              <ArrowLeft className="h-4 w-4" /> Вернуться в каталог
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
