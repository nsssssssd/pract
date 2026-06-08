'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

let scriptPromise = null;

function loadRecaptchaScript() {
  if (scriptPromise) return scriptPromise;

  if (typeof window === 'undefined') return Promise.resolve();

  if (window.grecaptcha?.render) {
    scriptPromise = Promise.resolve();
    return scriptPromise;
  }

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit';
    script.async = true;
    script.defer = true;

    window.onRecaptchaLoad = () => {
      resolve();
    };

    script.onerror = () => {
      reject(new Error('Failed to load reCAPTCHA'));
    };

    document.head.appendChild(script);
  });

  return scriptPromise;
}

export default function RecaptchaCheckbox({ onVerify, onExpire, theme = 'light', size = 'normal' }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  const reset = useCallback(() => {
    if (widgetIdRef.current !== null && window.grecaptcha) {
      try {
        window.grecaptcha.reset(widgetIdRef.current);
      } catch (e) {
        // ignore
      }
    }
    if (onVerify) onVerify('');
  }, [onVerify]);

  useEffect(() => {
    if (!SITE_KEY) {
      console.warn('[RecaptchaCheckbox] NEXT_PUBLIC_RECAPTCHA_SITE_KEY not set');
      if (onVerify) onVerify('');
      return;
    }

    let mounted = true;

    loadRecaptchaScript()
      .then(() => {
        if (!mounted || !containerRef.current) return;
        setLoaded(true);

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
              setError('Ошибка загрузки CAPTCHA. Обновите страницу.');
              if (onVerify) onVerify('');
            },
          });
        } catch (err) {
          console.error('[RecaptchaCheckbox] render error:', err);
          setError('Ошибка загрузки CAPTCHA');
        }
      })
      .catch((err) => {
        if (!mounted) return;
        console.error('[RecaptchaCheckbox] script load error:', err);
        setError('Не удалось загрузить CAPTCHA. Проверьте соединение.');
      });

    return () => {
      mounted = false;
      if (widgetIdRef.current !== null && window.grecaptcha) {
        try {
          window.grecaptcha.reset(widgetIdRef.current);
        } catch (e) {
          // ignore
        }
      }
    };
  }, [onVerify, onExpire, theme, size]);

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

export { reset };
