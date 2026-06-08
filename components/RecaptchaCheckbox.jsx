'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

let scriptLoaded = false;
let scriptCallbacks = [];

function onScriptLoad() {
  scriptLoaded = true;
  scriptCallbacks.forEach((cb) => cb());
  scriptCallbacks = [];
}

function loadRecaptchaScript() {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.grecaptcha?.render) {
    scriptLoaded = true;
    return Promise.resolve(true);
  }
  if (scriptLoaded) return Promise.resolve(true);

  return new Promise((resolve) => {
    scriptCallbacks.push(() => resolve(true));

    // Only create script tag once
    if (!document.querySelector('script[src*="recaptcha/api.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js?onload=__recaptchaOnLoad&render=explicit';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    window.__recaptchaOnLoad = onScriptLoad;
  });
}

export default function RecaptchaCheckbox({ onVerify, onExpire, theme = 'light', size = 'normal' }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const renderedRef = useRef(false);
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
      if (onVerify) onVerify('');
      return;
    }

    let mounted = true;

    loadRecaptchaScript().then((ok) => {
      if (!mounted || !ok || !containerRef.current) return;
      if (renderedRef.current) return;

      renderedRef.current = true;

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
      renderedRef.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
