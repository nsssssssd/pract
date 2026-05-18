import { useQuery } from '@tanstack/react-query';

async function fetchProducts() {
  const res = await fetch('/api/products');
  if (!res.ok) throw new Error('Ошибка загрузки товаров');
  return res.json();
}

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });
}
