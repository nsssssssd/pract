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
    staleTime: 5 * 60 * 1000,
  });
}

export function useAll1COrders(dateFrom, dateTo) {
  const params = new URLSearchParams();
  if (dateFrom) params.append('dateFrom', dateFrom);
  if (dateTo) params.append('dateTo', dateTo);

  const queryString = params.toString() ? `?${params.toString()}` : '';

  return useQuery({
    queryKey: ['1c-orders-all', dateFrom, dateTo],
    queryFn: async () => {
      const res = await fetch(`/api/orders/1c/sync${queryString}`, { credentials: 'include' });
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

export function useSync1COrders() {
  return useQuery({
    queryKey: ['1c-orders-sync'],
    queryFn: async () => {
      const res = await fetch('/api/orders/1c/sync', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Ошибка синхронизации с 1С');
      }
      return res.json();
    },
    enabled: false, // manual trigger
    retry: false,
  });
}
