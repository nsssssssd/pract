'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Cookie } from 'lucide-react';

const CONSENT_KEY = 'cookie-consent';

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(CONSENT_KEY);
      if (!consent) setShow(true);
    } catch {
      // ignore
    }
  }, []);

  function accept() {
    try {
      localStorage.setItem(CONSENT_KEY, 'accepted');
    } catch {
      // ignore
    }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="container mx-auto max-w-4xl">
        <div className="rounded-2xl border bg-card/95 backdrop-blur-md shadow-lg p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Cookie className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Мы используем cookie</p>
              <p>
                Продолжая пользоваться сайтом, вы соглашаетесь с использованием файлов cookie
                для улучшения работы сервиса.{' '}
                <a href="/care" className="text-primary hover:underline">
                  Подробнее
                </a>
              </p>
            </div>
          </div>
          <Button onClick={accept} className="w-full sm:w-auto shrink-0 rounded-full">
            Понятно
          </Button>
        </div>
      </div>
    </div>
  );
}
