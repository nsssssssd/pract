'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/store/cart';
import { useWishlistStore } from '@/store/wishlist';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Check, Heart, ShoppingCart, X } from 'lucide-react';
import { toast } from 'sonner';
import { hapticLight } from '@/lib/haptics';
import Image from 'next/image';
import Link from 'next/link';

export default function QuickViewModal({ product, open, onClose }) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const toggleItem = useWishlistStore((s) => s.toggleItem);
  const isInWishlist = useWishlistStore((s) => s.isInWishlist(product?.id));
  const [added, setAdded] = useState(false);

  if (!product) return null;

  function handleAdd() {
    addItem(product);
    hapticLight();
    setAdded(true);
    setTimeout(() => setAdded(false), 800);
    toast.custom((t) => (
      <div className="flex items-center gap-3 rounded-xl bg-card border shadow-lg px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg text-lg" style={{ background: product.color + '22' }}>
          {product.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">{product.name}</div>
          <div className="text-xs text-muted-foreground">Добавлено в корзину</div>
        </div>
        <button onClick={() => { toast.dismiss(t); openCart(); }} className="text-xs font-medium text-primary hover:underline">
          Оформить
        </button>
      </div>
    ), { duration: 2500 });
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden gap-0">
        <DialogHeader className="sr-only">
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2">
          {/* Image */}
          <div
            className="relative aspect-[4/3] sm:aspect-auto flex items-center justify-center"
            style={{ background: product.color + '22' }}
          >
            {product.image ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 50vw"
                loading="lazy"
                placeholder="blur"
                blurDataURL="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
              />
            ) : (
              <span className="text-7xl select-none">{product.emoji}</span>
            )}
            {product.unit === 'букет' && (
              <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">
                Букет
              </Badge>
            )}
          </div>

          {/* Info */}
          <div className="p-5 sm:p-6 flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-bold">{product.name}</h2>
              <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
                {product.description}
              </p>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{product.price} ₽</span>
              <span className="text-muted-foreground">/ {product.unit}</span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                className="rounded-full gap-2 flex-1"
                onClick={handleAdd}
                variant={added ? 'secondary' : 'default'}
              >
                {added ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                {added ? 'Добавлено' : 'В корзину'}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={() => toggleItem(product)}
                aria-label={isInWishlist ? 'Удалить из избранного' : 'Добавить в избранное'}
              >
                <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
            </div>

            <Link href={`/products/${product.id}`} onClick={onClose}>
              <Button variant="ghost" className="w-full text-sm">
                Перейти на страницу товара →
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
