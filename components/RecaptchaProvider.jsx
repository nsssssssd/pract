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
        console.log('[recaptcha] Script loaded');
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
    return null;
  }

  // Если grecaptcha ещё не загрузился — ждём максимум 3 секунды
  if (!window.grecaptcha) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  if (!window.grecaptcha || !window.grecaptcha.ready) {
    console.warn('[recaptcha] Not available, skipping');
    return null;
  }

  return new Promise((resolve) => {
    window.grecaptcha.ready(() => {
      window.grecaptcha.execute(siteKey, { action })
        .then((token) => resolve(token))
        .catch((err) => {
          console.error('[recaptcha] execute error:', err);
          resolve(null);
        });
    });
  });
}
