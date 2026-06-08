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

export default function RecaptchaCheckbox({ onVerify, onExpire, theme = 'light', size = 'normal' }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!SITE_KEY) {
      if (onVerify) onVerify('');
      return;
    }

    let cancelled = false;

    const init = async () => {
      const ok = await loadRecaptchaScript();
      if (cancelled) return;
      if (!ok) {
        setError('Не удалось загрузить CAPTCHA');
        return;
      }

      // Wait for container to be available
      const tryRender = () => {
        if (cancelled) return;
        if (!containerRef.current) {
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
              if (onVerify) onVerify(token);
            },
            'expired-callback': () => {
              if (onExpire) onExpire();
              if (onVerify) onVerify('');
            },
            'error-callback': () => {
              setError('Ошибка CAPTCHA. Обновите страницу.');
              if (onVerify) onVerify('');
            },
          });
          setReady(true);
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
  }, [theme, size, onVerify, onExpire]);

  if (!SITE_KEY) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={containerRef} className="min-h-[78px]" />
      {error && (
        <p className="text-xs text-destructive text-center">{error}</p>
      )}
    </div>
  );
}
