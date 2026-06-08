'use client';

import Script from 'next/script';

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

export default function RecaptchaProvider() {
  if (!RECAPTCHA_SITE_KEY) return null;

  return (
    <Script
      id="recaptcha-script"
      src={`https://www.google.com/recaptcha/api.js?render=explicit`}
      strategy="afterInteractive"
    />
  );
}

export function renderRecaptcha(containerId, onVerify) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!siteKey || typeof window === 'undefined' || !window.grecaptcha) {
    return null;
  }

  return window.grecaptcha.render(containerId, {
    sitekey: siteKey,
    callback: onVerify,
    'expired-callback': () => onVerify(null),
    'error-callback': () => onVerify(null),
  });
}

export function resetRecaptcha(widgetId) {
  if (typeof window !== 'undefined' && window.grecaptcha && widgetId !== null) {
    window.grecaptcha.reset(widgetId);
  }
}
