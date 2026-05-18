import { useQuery } from '@tanstack/react-query';

async function fetchAdminUsers() {
  const res = await fetch('/api/admin/users');
  if (!res.ok) throw new Error('Ошибка загрузки пользователей');
  return res.json();
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: fetchAdminUsers,
  });
}
