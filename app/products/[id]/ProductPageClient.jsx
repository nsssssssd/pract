'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCartStore } from '@/store/cart';
import { useWishlistStore } from '@/store/wishlist';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  ShoppingCart,
  Heart,
  Check,
  Home,
  ChevronRight,
  Share2,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { hapticLight } from '@/lib/haptics';

export default function ProductPageClient({ product }) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const toggleItem = useWishlistStore((s) => s.toggleItem);
  const isInWishlist = useWishlistStore(
    useCallback((s) => s.isInWishlist(product.id), [product.id])
  );
  const [added, setAdded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  function handleAdd() {
    addItem(product);
    hapticLight();
    setAdded(true);
    setTimeout(() => setAdded(false), 800);
    toast.custom(
      (t) => (
        <div className="flex items-center gap-3 rounded-xl bg-card border shadow-lg px-4 py-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg text-lg"
            style={{ background: product.color + '22' }}
          >
            {product.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">{product.name}</div>
            <div className="text-xs text-muted-foreground">
              Добавлено в корзину
            </div>
          </div>
          <button
            onClick={() => {
              toast.dismiss(t);
              openCart();
            }}
            className="text-xs font-medium text-primary hover:underline"
          >
            Оформить
          </button>
        </div>
      ),
      { duration: 2500 }
    );
  }

  async function handleShare() {
    const shareData = {
      title: product.name,
      text: `${product.description} — ${product.price} ₽`,
      url: `https://tulpanomsk55.ru/products/${product.id}`,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareData.url);
      toast.success('Ссылка скопирована!');
    }
  }

  return (
    <>
      <div className="container mx-auto px-4 py-6 md:py-10 max-w-5xl">
        {/* Breadcrumbs */}
        <nav
          className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground mb-6 md:mb-8"
          aria-label="Breadcrumb"
        >
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Главная</span>
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link
            href="/"
            className="hover:text-foreground transition-colors"
          >
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
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="relative aspect-square md:aspect-[4/3] flex items-center justify-center w-full"
                aria-label="Открыть изображение"
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
                  <span className="text-8xl md:text-9xl select-none">
                    {product.emoji}
                  </span>
                )}
                {product.unit === 'букет' && (
                  <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground text-sm px-3 py-1">
                    Букет
                  </Badge>
                )}
              </button>
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
              <h1 className="text-2xl md:text-4xl font-bold tracking-tight">
                {product.name}
              </h1>
              <p className="text-muted-foreground mt-2 md:mt-3 text-base md:text-lg leading-relaxed">
                {product.description}
              </p>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl md:text-4xl font-bold">
                {product.price} ₽
              </span>
              <span className="text-muted-foreground text-lg">
                / {product.unit}
              </span>
            </div>

            {/* Desktop buttons */}
            <div className="hidden md:flex flex-wrap gap-3 pt-1">
              <Button
                type="button"
                size="lg"
                className="rounded-full gap-2 flex-1 md:flex-none h-12 md:h-11 text-base"
                onClick={handleAdd}
                variant={added ? 'secondary' : 'default'}
              >
                {added ? (
                  <Check className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <ShoppingCart className="h-5 w-5" aria-hidden="true" />
                )}
                {added ? 'Добавлено' : 'В корзину'}
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="rounded-full gap-2 h-12 md:h-11 text-base"
                onClick={() => toggleItem(product)}
                aria-label={
                  isInWishlist
                    ? 'Удалить из избранного'
                    : 'Добавить в избранное'
                }
              >
                <Heart
                  className={`h-5 w-5 ${
                    isInWishlist ? 'fill-red-500 text-red-500' : ''
                  }`}
                  aria-hidden="true"
                />
                {isInWishlist ? 'В избранном' : 'В избранное'}
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="rounded-full gap-2 h-12 md:h-11 text-base"
                onClick={handleShare}
                aria-label="Поделиться"
              >
                <Share2 className="h-5 w-5" aria-hidden="true" />
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

      {/* Mobile sticky bar */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t px-4 py-3 flex items-center gap-3">
        <div className="flex-1">
          <div className="text-lg font-bold">{product.price} ₽</div>
          <div className="text-xs text-muted-foreground">/ {product.unit}</div>
        </div>
        <Button
          type="button"
          className="rounded-full gap-2 flex-1 h-11"
          onClick={handleAdd}
          variant={added ? 'secondary' : 'default'}
        >
          {added ? (
            <Check className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ShoppingCart className="h-4 w-4" aria-hidden="true" />
          )}
          {added ? 'Добавлено' : 'В корзину'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="rounded-full h-11 w-11"
          onClick={() => toggleItem(product)}
          aria-label={
            isInWishlist
              ? 'Удалить из избранного'
              : 'Добавить в избранное'
          }
        >
          <Heart
            className={`h-5 w-5 ${
              isInWishlist ? 'fill-red-500 text-red-500' : ''
            }`}
            aria-hidden="true"
          />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="rounded-full h-11 w-11"
          onClick={handleShare}
          aria-label="Поделиться"
        >
          <Share2 className="h-5 w-5" aria-hidden="true" />
        </Button>
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black/90 border-0">
          <DialogTitle className="sr-only">{product.name}</DialogTitle>
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="relative aspect-square flex items-center justify-center">
            {product.image ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            ) : (
              <span className="text-9xl select-none">{product.emoji}</span>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
