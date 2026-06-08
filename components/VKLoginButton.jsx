'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const VK_APP_ID = process.env.NEXT_PUBLIC_VK_APP_ID;

export default function VKLoginButton({ mode = 'login' }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!VK_APP_ID) return;

    // Обработка callback от VK (после редиректа)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const deviceId = urlParams.get('device_id');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    if (error) {
      toast.error('Ошибка авторизации VK');
      return;
    }

    if (code && deviceId) {
      // Очищаем URL
      window.history.replaceState({}, document.title, window.location.pathname);
      handleVKCode(code, deviceId, state);
    }
  }, []);

  async function handleVKCode(code, deviceId, state) {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/vk', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, device_id: deviceId, state }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(mode === 'register' ? 'Аккаунт создан!' : 'Добро пожаловать!');
      window.dispatchEvent(new Event('auth-change'));
      router.push(data.user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      toast.error(err.message || 'Ошибка входа через VK');
    }
    setLoading(false);
  }

  function generateState() {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
  }

  async function handleClick() {
    if (!VK_APP_ID) {
      toast.error('VK OAuth не настроен');
      return;
    }

    setLoading(true);

    // Прямой редирект на VK ID
    const authUrl = new URL('https://id.vk.com/authorize');
    authUrl.searchParams.set('client_id', VK_APP_ID);
    authUrl.searchParams.set('redirect_uri', `${window.location.origin}/login`);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'profile');
    authUrl.searchParams.set('state', generateState());

    window.location.href = authUrl.toString();
  }

  // Если VK не настроен — не показываем кнопку
  if (!VK_APP_ID) {
    return null;
  }

  return (
    <Button
      type="button"
      className="w-full gap-2 h-12 rounded-full bg-[#0077FF] text-white hover:bg-[#0066DD] hover:text-white border-0"
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.785 16.241s.288-.032.436-.194c.136-.148.132-.427.132-.427s-.02-1.304.587-1.496c.598-.189 1.365 1.26 2.18 1.817.616.422 1.084.33 1.084.33l2.177-.03s1.14-.071.599-.97c-.044-.073-.314-.66-1.617-1.867-1.364-1.261-1.182-1.057.462-3.236.999-1.332 1.398-2.146 1.273-2.494-.12-.332-.86-.244-.86-.244l-2.45.015s-.181-.025-.316.056c-.132.079-.217.263-.217.263s-.39 1.037-.91 1.92c-1.096 1.86-1.534 1.96-1.714 1.842-.42-.271-.315-1.091-.315-1.672 0-1.818.276-2.576-.537-2.773-.27-.065-.467-.108-1.156-.115-.883-.01-1.63.003-2.055.21-.282.138-.499.446-.366.463.164.022.535.1.732.365.254.34.245 1.103.245 1.103s.146 1.673-.34 1.882c-.334.144-.792-.15-1.774-1.493-.503-.693-.883-1.46-.883-1.46s-.074-.18-.206-.276c-.16-.118-.383-.155-.383-.155l-2.33.015s-.35.01-.478.162c-.115.136-.009.417-.009.417s1.83 4.282 3.9 6.44c1.9 1.98 4.06 1.85 4.06 1.85h.978z" />
        </svg>
      )}
      {mode === 'register' ? 'Быстрая регистрация через VK' : 'Войти через VK'}
    </Button>
  );
}
