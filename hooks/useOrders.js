import { useQuery } from '@tanstack/react-query';

async function fetchOrders() {
  const res = await fetch('/api/orders');
  if (!res.ok) throw new Error('Ошибка загрузки заказов');
  return res.json();
}

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders,
  });
}
