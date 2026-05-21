'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2, Mail, Smartphone, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginContent() {
  const router = useRouter();
  const [method, setMethod] = useState('email'); // 'email' | 'phone'
  const [phoneStep, setPhoneStep] = useState(1); // 1: ввод телефона, 2: ввод кода
  const [form, setForm] = useState({ email: '', password: '', phone: '' });
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [normalizedPhone, setNormalizedPhone] = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function startTimer(seconds = 60) {
    setTimer(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  async function handleEmailLogin(e) {
    e?.preventDefault?.();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Добро пожаловать!');
      window.dispatchEvent(new Event('auth-change'));
      router.push(data.user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  async function handleSendPhoneCode() {
    setError('');
    if (!form.phone.trim()) {
      setError('Введите номер телефона');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: form.phone.trim(), type: 'phone', mode: 'login' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(data.message || 'Код отправлен');
      if (data.target) setNormalizedPhone(data.target);
      setPhoneStep(2);
      startTimer(60);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  async function handlePhoneLogin() {
    setError('');
    if (!code || code.length !== 6) {
      setError('Введите 6-значный код');
      return;
    }
    setLoading(true);
    try {
      const phone = normalizedPhone || form.phone.trim();

      // Сначала отправляем код, если он ещё не был отправлен
      // Затем логинимся (код проверяется на сервере)
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Добро пожаловать!');
      window.dispatchEvent(new Event('auth-change'));
      router.push(data.user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <div className="container mx-auto px-4 max-w-md flex flex-col justify-center min-h-[calc(100dvh-3.5rem-4rem)] md:py-12 md:block md:min-h-0">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader className="text-center space-y-2">
            <div className="text-4xl">🌷</div>
            <h1 className="text-2xl font-bold">Добро пожаловать</h1>
            <p className="text-sm text-muted-foreground">Войдите в свой аккаунт</p>
          </CardHeader>
          <CardContent>
            {error && <div className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}

            {/* Method toggle */}
            <div className="flex rounded-lg border p-1 mb-6 bg-muted/50">
              <button
                type="button"
                onClick={() => { setMethod('email'); setPhoneStep(1); setCode(''); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                  method === 'email' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Mail className="h-4 w-4" /> Email
              </button>
              <button
                type="button"
                onClick={() => { setMethod('phone'); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                  method === 'phone' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Smartphone className="h-4 w-4" /> Телефон
              </button>
            </div>

            <AnimatePresence mode="wait">
              {method === 'email' && (
                <motion.form
                  key="email"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onSubmit={handleEmailLogin}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Пароль</Label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Входим...</> : 'Войти'}
                  </Button>
                </motion.form>
              )}

              {method === 'phone' && phoneStep === 1 && (
                <motion.form
                  key="phone-form"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onSubmit={(e) => { e.preventDefault(); handleSendPhoneCode(); }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="phone">Номер телефона</Label>
                    <Input
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="+7 (999) 999-99-99"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">На этот номер придёт SMS с кодом для входа</p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Отправляем...</> : 'Получить код'}
                  </Button>
                </motion.form>
              )}

              {method === 'phone' && phoneStep === 2 && (
                <motion.form
                  key="phone-code"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onSubmit={(e) => { e.preventDefault(); handlePhoneLogin(); }}
                  className="space-y-4"
                >
                  <button
                    type="button"
                    onClick={() => { setPhoneStep(1); setCode(''); setError(''); }}
                    className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Назад
                  </button>

                  <div className="text-center space-y-1">
                    <p className="text-sm text-muted-foreground">Код отправлен на {form.phone}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="code">Код подтверждения</Label>
                    <Input
                      id="code"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="000000"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                      className="text-center text-lg tracking-widest"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading || code.length !== 6}
                  >
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Входим...</> : 'Войти'}
                  </Button>

                  <div className="text-center">
                    {timer > 0 ? (
                      <span className="text-xs text-muted-foreground">Повторная отправка через {timer} сек</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendPhoneCode}
                        disabled={loading}
                        className="text-xs text-primary hover:underline disabled:opacity-50"
                      >
                        Отправить код повторно
                      </button>
                    )}
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Нет аккаунта? <Link href="/register" className="text-primary hover:underline">Зарегистрироваться</Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
