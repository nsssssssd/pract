'use client';

import { useEffect, useRef, useState } from 'react';

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

let scriptPromise = null;

function loadRecaptchaScript() {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.grecaptcha?.render) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve) => {
    const cbName = '__recaptchaOnLoad_' + Math.random().toString(36).slice(2, 9);
    window[cbName] = () => {
      resolve(true);
      delete window[cbName];
    };

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?onload=${cbName}&render=explicit`;
    script.async = true;
    script.defer = true;
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

  return scriptPromise;
}

function getRecaptchaSize() {
  if (typeof window === 'undefined') return 'normal';
  // Compact checkbox fits screens down to ~320px
  return window.innerWidth < 360 ? 'compact' : 'normal';
}

export default function RecaptchaCheckbox({ onVerify, onExpire, theme = 'light' }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [error, setError] = useState('');
  const [size, setSize] = useState(getRecaptchaSize);

  // Stabilize callbacks with refs to avoid effect re-runs
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onVerifyRef.current = onVerify;
    onExpireRef.current = onExpire;
  });

  // Track viewport size to switch between normal/compact reCAPTCHA
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setSize(getRecaptchaSize());
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!SITE_KEY) {
      if (onVerifyRef.current) onVerifyRef.current('');
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 300; // ~5 seconds at 60fps

    const init = async () => {
      const ok = await loadRecaptchaScript();
      if (cancelled) return;
      if (!ok) {
        setError('Не удалось загрузить CAPTCHA');
        return;
      }

      const tryRender = () => {
        if (cancelled) return;
        if (!containerRef.current) {
          attempts++;
          if (attempts > MAX_ATTEMPTS) {
            setError('Ошибка загрузки CAPTCHA. Обновите страницу.');
            return;
          }
          requestAnimationFrame(tryRender);
          return;
        }
        if (widgetIdRef.current !== null) return;

        try {
          widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
            sitekey: SITE_KEY,
            theme,
            size,
            callback: (token) => {
              setError('');
              if (onVerifyRef.current) onVerifyRef.current(token);
            },
            'expired-callback': () => {
              if (onExpireRef.current) onExpireRef.current();
              if (onVerifyRef.current) onVerifyRef.current('');
            },
            'error-callback': () => {
              setError('Ошибка CAPTCHA. Обновите страницу.');
              if (onVerifyRef.current) onVerifyRef.current('');
            },
          });
        } catch (err) {
          console.error('[RecaptchaCheckbox] render error:', err);
          setError('Ошибка загрузки CAPTCHA');
        }
      };

      tryRender();
    };

    init();

    return () => {
      cancelled = true;
      if (widgetIdRef.current !== null && window.grecaptcha) {
        try {
          window.grecaptcha.reset(widgetIdRef.current);
        } catch (e) {
          // ignore
        }
      }
      widgetIdRef.current = null;
    };
  }, [theme, size]); // Re-render widget when theme or size changes

  if (!SITE_KEY) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <div className="w-full flex justify-center overflow-hidden">
        <div
          ref={containerRef}
          className="min-h-[78px] flex justify-center"
          style={{
            transform: size === 'compact' && typeof window !== 'undefined' && window.innerWidth < 340 ? 'scale(0.92)' : undefined,
            transformOrigin: 'center top',
          }}
        />
      </div>
      {error && (
        <p className="text-xs text-destructive text-center">{error}</p>
      )}
    </div>
  );
}
