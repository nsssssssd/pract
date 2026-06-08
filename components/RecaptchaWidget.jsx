'use client';

import { useEffect, useRef, useState } from 'react';

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

export default function RecaptchaWidget({ onVerify }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY || !containerRef.current) return;

    const renderWidget = () => {
      if (!window.grecaptcha || !containerRef.current) return;
      
      try {
        widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
          sitekey: RECAPTCHA_SITE_KEY,
          callback: (token) => {
            console.log('[recaptcha] verified');
            onVerify(token);
          },
          'expired-callback': () => {
            console.log('[recaptcha] expired');
            onVerify(null);
          },
          'error-callback': () => {
            console.log('[recaptcha] error');
            onVerify(null);
          },
        });
        setLoaded(true);
      } catch (err) {
        console.error('[recaptcha] render error:', err);
      }
    };

    // Wait for grecaptcha to load
    if (window.grecaptcha && window.grecaptcha.render) {
      renderWidget();
    } else {
      const checkInterval = setInterval(() => {
        if (window.grecaptcha && window.grecaptcha.render) {
          clearInterval(checkInterval);
          renderWidget();
        }
      }, 200);

      // Timeout after 5 seconds
      setTimeout(() => clearInterval(checkInterval), 5000);
    }

    return () => {
      if (widgetIdRef.current !== null && window.grecaptcha) {
        try {
          window.grecaptcha.reset(widgetIdRef.current);
        } catch {
          // ignore
        }
      }
    };
  }, [onVerify]);

  if (!RECAPTCHA_SITE_KEY) {
    return null;
  }

  return (
    <div className="flex justify-center">
      <div ref={containerRef} />
      {!loaded && (
        <div className="text-sm text-muted-foreground">Загрузка CAPTCHA...</div>
      )}
    </div>
  );
}
