import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const SYNC_DEBOUNCE_MS = 500;

function mergeWishlistItems(localItems, serverItems) {
  const map = new Map();
  for (const item of serverItems || []) {
    if (item?.id != null) map.set(item.id, { ...item });
  }
  for (const item of localItems || []) {
    if (item?.id != null && !map.has(item.id)) {
      map.set(item.id, { ...item });
    }
  }
  return Array.from(map.values());
}

async function syncToServer(items) {
  try {
    await fetch('/api/wishlist', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
      credentials: 'include',
    });
  } catch {
    // ignore network errors; localStorage is the source of truth offline
  }
}

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],
      userId: null,
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

      setUserId: async (userId) => {
        const state = get();
        if (state.userId === userId) return;

        if (!userId) {
          set({ userId: null });
          return;
        }

        try {
          const res = await fetch('/api/wishlist', { credentials: 'include' });
          const serverWishlist = res.ok ? await res.json() : { items: [] };
          const merged = mergeWishlistItems(state.items, serverWishlist.items);
          set({ userId, items: merged });
          await syncToServer(merged);
        } catch {
          set({ userId });
        }
      },
    }),
    { name: 'tulpan-wishlist' }
  )
);

// Debounced server sync when wishlist changes for logged-in users
let wishlistSyncTimeout;
useWishlistStore.subscribe((state, prevState) => {
  if (state.userId && state.items !== prevState.items) {
    clearTimeout(wishlistSyncTimeout);
    wishlistSyncTimeout = setTimeout(() => {
      syncToServer(state.items);
    }, SYNC_DEBOUNCE_MS);
  }
});
