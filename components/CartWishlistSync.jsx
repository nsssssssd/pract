'use client';

import { useEffect } from 'react';
import { useCartStore } from '@/store/cart';
import { useWishlistStore } from '@/store/wishlist';

export default function CartWishlistSync() {
  const setCartUserId = useCartStore((s) => s.setUserId);
  const setWishlistUserId = useWishlistStore((s) => s.setUserId);

  useEffect(() => {
    let mounted = true;

    async function syncUser() {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        const user = res.ok ? await res.json() : null;
        if (!mounted) return;
        setCartUserId(user?.id || null);
        setWishlistUserId(user?.id || null);
      } catch {
        if (mounted) {
          setCartUserId(null);
          setWishlistUserId(null);
        }
      }
    }

    syncUser();

    const handleAuthChange = () => syncUser();
    window.addEventListener('auth-change', handleAuthChange);

    return () => {
      mounted = false;
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, [setCartUserId, setWishlistUserId]);

  return null;
}
