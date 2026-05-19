import { useQuery } from '@tanstack/react-query';

async function fetchMyOrders() {
  const res = await fetch('/api/orders/my');
  if (!res.ok) throw new Error('Ошибка загрузки заказов');
  return res.json();
}

export function useMyOrders() {
  return useQuery({
    queryKey: ['my-orders'],
    queryFn: fetchMyOrders,
  });
}
