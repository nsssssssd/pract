import { useQuery } from '@tanstack/react-query';

export function use1COrders() {
  return useQuery({
    queryKey: ['1c-orders'],
    queryFn: async () => {
      const res = await fetch('/api/orders/1c', { credentials: 'include' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Ошибка загрузки заказов из 1С');
      }
      return res.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 минут
  });
}

export function useAll1COrders() {
  return useQuery({
    queryKey: ['1c-orders-all'],
    queryFn: async () => {
      const res = await fetch('/api/orders/1c/sync', { credentials: 'include' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Ошибка загрузки заказов из 1С');
      }
      return res.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
