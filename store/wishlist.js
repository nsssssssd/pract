import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],
      toggleItem: (product) =>
        set((s) => {
          const exists = s.items.some((p) => p.id === product.id);
          return exists
            ? { items: s.items.filter((p) => p.id !== product.id) }
            : { items: [...s.items, product] };
        }),
      removeItem: (id) => set((s) => ({ items: s.items.filter((p) => p.id !== id) })),
      isInWishlist: (id) => get().items.some((p) => p.id === id),
      count: () => get().items.length,
      clearItems: () => set({ items: [] }),
    }),
    { name: 'tulpan-wishlist' }
  )
);
