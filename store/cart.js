import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const SYNC_DEBOUNCE_MS = 500;

function mergeCartItems(localItems, serverItems) {
  const map = new Map();
  for (const item of serverItems || []) {
    if (item?.id != null) map.set(item.id, { ...item });
  }
  for (const item of localItems || []) {
    if (item?.id == null) continue;
    const existing = map.get(item.id);
    if (existing) {
      existing.qty = Math.max(existing.qty || 0, item.qty || 0);
    } else {
      map.set(item.id, { ...item });
    }
  }
  return Array.from(map.values());
}

async function syncToServer(items) {
  try {
    await fetch('/api/cart', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
      credentials: 'include',
    });
  } catch {
    // ignore network errors; localStorage is the source of truth offline
  }
}

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      userId: null,
      isOpen: false,
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
      addItem: (product) =>
        set((state) => {
          const ex = state.items.find((i) => i.id === product.id);
          if (ex) {
            return {
              items: state.items.map((i) =>
                i.id === product.id ? { ...i, qty: i.qty + 1 } : i
              ),
            };
          }
          return { items: [...state.items, { ...product, qty: 1 }] };
        }),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),
      updateQuantity: (id, qty) =>
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter((i) => i.id !== id)
              : state.items.map((i) => (i.id === id ? { ...i, qty } : i)),
        })),
      clearCart: () => set({ items: [] }),
      total: () =>
        get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
      count: () =>
        get().items.reduce((sum, i) => sum + i.qty, 0),

      setUserId: async (userId) => {
        const state = get();
        if (state.userId === userId) return;

        if (!userId) {
          set({ userId: null });
          return;
        }

        // Load server cart and merge with local guest cart
        try {
          const res = await fetch('/api/cart', { credentials: 'include' });
          const serverCart = res.ok ? await res.json() : { items: [] };
          const merged = mergeCartItems(state.items, serverCart.items);
          set({ userId, items: merged });
          // Persist merged cart to server
          await syncToServer(merged);
        } catch {
          set({ userId });
        }
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);

// Debounced server sync when cart changes for logged-in users
let cartSyncTimeout;
useCartStore.subscribe((state, prevState) => {
  if (state.userId && state.items !== prevState.items) {
    clearTimeout(cartSyncTimeout);
    cartSyncTimeout = setTimeout(() => {
      syncToServer(state.items);
    }, SYNC_DEBOUNCE_MS);
  }
});
