'use client';

import { motion } from 'framer-motion';
import { useCartStore } from '@/store/cart';
import { useWishlistStore } from '@/store/wishlist';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Check, Heart, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useCallback } from 'react';

export default function ProductCard({ product, index }) {
  const addItem = useCartStore((s) => s.addItem);
  const toggleItem = useWishlistStore((s) => s.toggleItem);
  const isInWishlist = useWishlistStore(useCallback((s) => s.isInWishlist(product.id), [product.id]));
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 800);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
        <div
          className="relative aspect-[4/3] flex items-center justify-center overflow-hidden"
          style={{ background: product.color + '22' }}
        >
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority={index < 4}
            />
          ) : (
            <span className="text-6xl md:text-7xl select-none">{product.emoji}</span>
          )}
          {product.unit === 'букет' && (
            <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">
              Букет
            </Badge>
          )}
          <button
            type="button"
            onClick={() => toggleItem(product)}
            aria-label={isInWishlist ? 'Удалить из избранного' : 'Добавить в избранное'}
            className="absolute top-3 left-3 flex h-8 w-8 md:h-7 md:w-7 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm transition-transform hover:scale-110"
          >
            <Heart
              className={`h-4 w-4 md:h-3.5 md:w-3.5 transition-colors ${
                isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-500'
              }`}
              aria-hidden="true"
            />
          </button>
        </div>
        <CardContent className="p-4 md:p-5">
          <Link href={`/products/${product.id}`} className="block group/link">
            <div className="text-base md:text-sm font-medium mb-1 group-hover/link:text-primary transition-colors flex items-center gap-1">
              {product.name}
              <ArrowUpRight className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
            </div>
          </Link>
          <div className="text-sm md:text-xs text-muted-foreground mb-4 line-clamp-2">
            {product.description}
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-lg md:text-base font-bold">{product.price} ₽</span>
              <span className="text-sm md:text-xs text-muted-foreground"> / {product.unit}</span>
            </div>
            <Button
              type="button"
              size="sm"
              className="rounded-full h-10 w-10 md:h-8 md:w-8 p-0"
              onClick={handleAdd}
              variant={added ? 'secondary' : 'default'}
              aria-label={added ? 'Добавлено в корзину' : 'Добавить в корзину'}
            >
              {added ? <Check className="h-5 w-5 md:h-4 md:w-4" aria-hidden="true" /> : <Plus className="h-5 w-5 md:h-4 md:w-4" aria-hidden="true" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
