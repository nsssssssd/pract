'use client';

import Script from 'next/script';

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

export default function RecaptchaProvider() {
  if (!RECAPTCHA_SITE_KEY) return null;

  return (
    <Script
      src={`https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`}
      strategy="lazyOnload"
    />
  );
}

export async function executeRecaptcha(action = 'submit', retries = 3) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!siteKey || typeof window === 'undefined') {
    return null;
  }

  // Ждём загрузки reCAPTCHA
  for (let i = 0; i < retries; i++) {
    if (window.grecaptcha && window.grecaptcha.ready) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  if (!window.grecaptcha || !window.grecaptcha.ready) {
    console.warn('[recaptcha] Script not loaded after retries');
    return null;
  }

  return new Promise((resolve) => {
    window.grecaptcha.ready(() => {
      window.grecaptcha.execute(siteKey, { action }).then(resolve).catch(() => resolve(null));
    });
  });
}
