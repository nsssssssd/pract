'use client';

import Script from 'next/script';

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

export default function RecaptchaProvider() {
  if (!RECAPTCHA_SITE_KEY) return null;

  return (
    <Script
      id="recaptcha-script"
      src={`https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`}
      strategy="afterInteractive"
      onLoad={() => {
        console.log('[recaptcha] Script loaded, key:', RECAPTCHA_SITE_KEY?.slice(0, 10) + '...');
      }}
      onError={(e) => {
        console.error('[recaptcha] Script failed to load:', e);
      }}
    />
  );
}

export async function executeRecaptcha(action = 'submit') {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!siteKey || typeof window === 'undefined') {
    console.log('[recaptcha] No site key or not browser');
    return null;
  }

  // Ждём загрузки grecaptcha
  let attempts = 0;
  while (!window.grecaptcha && attempts < 10) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    attempts++;
  }

  if (!window.grecaptcha) {
    console.warn('[recaptcha] grecaptcha not available after 3s');
    return null;
  }

  return new Promise((resolve) => {
    window.grecaptcha.ready(() => {
      console.log('[recaptcha] Executing for action:', action);
      window.grecaptcha.execute(siteKey, { action })
        .then((token) => {
          console.log('[recaptcha] Token received:', token?.slice(0, 20) + '...');
          resolve(token);
        })
        .catch((err) => {
          console.error('[recaptcha] execute error:', err);
          resolve(null);
        });
    });
  });
}
