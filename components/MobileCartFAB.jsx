'use client';

import { useCartStore } from '@/store/cart';
import { ShoppingCart } from 'lucide-react';

export default function MobileCartFAB() {
  const count = useCartStore((s) => s.count());
  const openCart = useCartStore((s) => s.openCart);

  if (count === 0) return null;

  return (
    <button
      type="button"
      onClick={openCart}
      className="md:hidden fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-95 hover:scale-105"
      aria-label="Открыть корзину"
    >
      <ShoppingCart className="h-6 w-6" aria-hidden="true" />
      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
        {count}
      </span>
    </button>
  );
}
