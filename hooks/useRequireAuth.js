'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export function useRequireAuth() {
  const router = useRouter();
  const { data: user, isLoading } = useAuth();

  return function requireAuth(actionText = 'выполнить действие') {
    if (isLoading) return false;
    if (!user) {
      toast.error(`Войдите или зарегистрируйтесь, чтобы ${actionText}`);
      router.push('/login');
      return false;
    }
    return true;
  };
}
