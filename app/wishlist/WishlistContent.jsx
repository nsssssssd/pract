'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useWishlistStore } from '@/store/wishlist';
import { useCartStore } from '@/store/cart';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, ShoppingCart, Trash2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { hapticLight } from '@/lib/haptics';

export default function WishlistContent() {
  const items = useWishlistStore((s) => s.items);
  const removeItem = useWishlistStore((s) => s.removeItem);
  const addToCart = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Назад
          </Button>
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold">Избранное</h1>
        <Badge variant="secondary">{items.length}</Badge>
      </div>

      {items.length > 0 && (
        <p className="text-xs text-muted-foreground mb-4 md:hidden">
          👈 Свайпните карточку влево, чтобы удалить
        </p>
      )}
      {items.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <div className="text-6xl">🌷</div>
          <h2 className="text-xl font-semibold">В избранном пока пусто</h2>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Нажмите на сердечко на карточке товара, чтобы добавить его в избранное
          </p>
          <Link href="/">
            <Button className="rounded-full mt-2">В каталог</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {items.map((product, i) => (
            <div key={product.id} className="relative overflow-hidden rounded-2xl">
              {/* Swipe delete background */}
              <div className="absolute inset-y-0 right-0 w-full flex items-center justify-end bg-destructive rounded-2xl px-5">
                <Trash2 className="h-6 w-6 text-destructive-foreground" />
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                drag="x"
                dragConstraints={{ left: -100, right: 0 }}
                dragElastic={0.1}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -80) {
                    removeItem(product.id);
                    hapticLight();
                  }
                }}
                style={{ touchAction: 'pan-y' }}
              >
                <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] bg-background relative z-10">
                  <div
                    className="relative aspect-[4/3] flex items-center justify-center overflow-hidden"
                    style={{ background: product.color + '22' }}
                  >
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        placeholder="blur"
                        blurDataURL="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
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
                      onClick={() => { removeItem(product.id); hapticLight(); }}
                      className="absolute top-3 left-3 flex h-8 w-8 md:h-7 md:w-7 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm transition-transform hover:scale-110"
                    >
                      <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                    </button>
                  </div>
                  <CardContent className="p-4 md:p-5">
                    <div className="text-base md:text-sm font-medium mb-1">{product.name}</div>
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
                        className="rounded-full h-9 w-9 md:h-8 md:w-8 p-0"
                        onClick={() => { addToCart(product); openCart(); }}
                        aria-label="Добавить в корзину"
                      >
                        <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
