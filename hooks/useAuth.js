import { useQuery } from '@tanstack/react-query';

async function fetchMe() {
  const res = await fetch('/api/auth/me', { credentials: 'include' });
  if (!res.ok) return null;
  return res.json();
}

export function useAuth() {
  return useQuery({
    queryKey: ['me'],
    queryFn: fetchMe,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
