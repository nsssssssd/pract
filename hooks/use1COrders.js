import { useQuery } from '@tanstack/react-query';

async function fetch1COrders() {
  const res = await fetch('/api/orders/1c');
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Ошибка загрузки заказов из 1С');
  }
  return res.json();
}

export function use1COrders() {
  return useQuery({
    queryKey: ['1c-orders'],
    queryFn: fetch1COrders,
    retry: false,
    // Не запрашиваем если 1С не настроена (503) — запоминаем ошибку
    staleTime: 5 * 60 * 1000, // 5 минут
  });
}
