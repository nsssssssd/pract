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

export async function executeRecaptcha(action = 'submit') {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!siteKey || typeof window === 'undefined' || !window.grecaptcha) {
    return null;
  }

  return new Promise((resolve) => {
    window.grecaptcha.ready(() => {
      window.grecaptcha.execute(siteKey, { action }).then(resolve).catch(() => resolve(null));
    });
  });
}
