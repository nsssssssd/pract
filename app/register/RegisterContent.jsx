'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2, Mail, Smartphone, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  if (password.length < 6) return 'Минимум 6 символов';
  if (!/[A-Za-zА-Яа-яЁё]/.test(password)) return 'Должна быть хотя бы одна буква';
  if (!/\d/.test(password)) return 'Должна быть хотя бы одна цифра';
  return '';
}

export default function RegisterContent() {
  const router = useRouter();
  const [method, setMethod] = useState(null); // null | 'email' | 'phone'
  const [step, setStep] = useState(1); // 1: форма, 2: код, 3: успех
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);
  const [normalizedTarget, setNormalizedTarget] = useState('');
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

  async function handleSendCode() {
    setError('');

    if (!form.name.trim() || form.name.trim().length < 2) {
      setError('Введите имя (минимум 2 символа)');
      return;
    }

    const target = method === 'email' ? form.email.trim() : form.phone.trim();

    if (method === 'email') {
      if (!validateEmail(form.email)) {
        setError('Введите корректный email');
        return;
      }
      if (validatePassword(form.password)) {
        setError(validatePassword(form.password));
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError('Пароли не совпадают');
        return;
      }
    }

    if (method === 'phone' && !target) {
      setError('Введите номер телефона');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, type: method, name: form.name.trim(), mode: 'register' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(data.message || 'Код отправлен');
      if (data.target) setNormalizedTarget(data.target);
      setStep(2);
      startTimer(60);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  async function handleVerifyAndRegister() {
    setError('');
    if (!code || code.length !== 6) {
      setError('Введите 6-значный код');
      return;
    }

    setLoading(true);
    try {
      const target = normalizedTarget || (method === 'email' ? form.email.trim() : form.phone.trim());

      // Register (код проверяется на сервере)
      const payload = {
        name: form.name.trim(),
        code,
        type: method,
      };
      if (method === 'email') {
        payload.email = target;
        payload.password = form.password;
      } else {
        payload.phone = target;
      }

      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const regData = await regRes.json();
      if (!regRes.ok) throw new Error(regData.error);

      toast.success('Аккаунт создан!');
      window.dispatchEvent(new Event('auth-change'));
      setShowWelcome(true);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  function handleGoHome() {
    setShowWelcome(false);
    window.dispatchEvent(new Event('auth-change'));
    setTimeout(() => {
      router.push('/profile');
    }, 200);
  }

  function reset() {
    setMethod(null);
    setStep(1);
    setForm({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
    setCode('');
    setError('');
    setTimer(0);
    setNormalizedTarget('');
    if (timerRef.current) clearInterval(timerRef.current);
  }

  return (
    <div className="container mx-auto px-4 pt-10 pb-12 max-w-md">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader className="text-center space-y-2">
            <div className="text-4xl">🌷</div>
            <h1 className="text-2xl font-bold">Создать аккаунт</h1>
            <p className="text-sm text-muted-foreground">Регистрация займёт минуту</p>
          </CardHeader>
          <CardContent>
            {error && <div className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}

            <AnimatePresence mode="wait">
              {/* Step 0: Choose method */}
              {!method && (
                <motion.div
                  key="choose"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-3"
                >
                  <p className="text-sm text-muted-foreground text-center mb-2">Выберите способ регистрации</p>
                  <Button
                    variant="outline"
                    className="w-full h-14 justify-start gap-3 text-base"
                    onClick={() => setMethod('email')}
                  >
                    <Mail className="h-5 w-5 text-primary" />
                    По Email
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-14 justify-start gap-3 text-base"
                    onClick={() => setMethod('phone')}
                  >
                    <Smartphone className="h-5 w-5 text-primary" />
                    По номеру телефона
                  </Button>
                  <p className="text-center text-sm text-muted-foreground pt-2">
                    Уже есть аккаунт? <Link href="/login" className="text-primary hover:underline">Войти</Link>
                  </p>
                </motion.div>
              )}

              {/* Step 1: Form */}
              {method && step === 1 && (
                <motion.form
                  key="form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={(e) => { e.preventDefault(); handleSendCode(); }}
                  className="space-y-4"
                >
                  <button
                    type="button"
                    onClick={reset}
                    className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Назад
                  </button>

                  <div className="space-y-2">
                    <Label htmlFor="name">Имя</Label>
                    <Input
                      id="name"
                      autoComplete="name"
                      placeholder="Ваше имя"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </div>

                  {method === 'email' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          autoComplete="email"
                          placeholder="you@example.com"
                          value={form.email}
                          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Пароль</Label>
                        <Input
                          id="password"
                          type="password"
                          autoComplete="new-password"
                          placeholder="Минимум 6 символов, буква и цифра"
                          value={form.password}
                          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Повторите пароль</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          autoComplete="new-password"
                          placeholder="••••••••"
                          value={form.confirmPassword}
                          onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                        />
                      </div>
                    </>
                  )}

                  {method === 'phone' && (
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
                      <p className="text-xs text-muted-foreground">На этот номер придёт SMS с кодом</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Отправляем...</>
                    ) : (
                      'Получить код'
                    )}
                  </Button>
                </motion.form>
              )}

              {/* Step 2: Code */}
              {method && step === 2 && (
                <motion.form
                  key="code"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={(e) => { e.preventDefault(); handleVerifyAndRegister(); }}
                  className="space-y-4"
                >
                  <button
                    type="button"
                    onClick={() => { setStep(1); setCode(''); setError(''); }}
                    className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Назад
                  </button>

                  <div className="text-center space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Код отправлен на {method === 'email' ? form.email : form.phone}
                    </p>
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
                    {loading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Проверяем...</>
                    ) : (
                      'Подтвердить и зарегистрироваться'
                    )}
                  </Button>

                  <div className="text-center">
                    {timer > 0 ? (
                      <span className="text-xs text-muted-foreground">Повторная отправка через {timer} сек</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendCode}
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
          </CardContent>
        </Card>
      </motion.div>

      {showWelcome && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center px-4"
          style={{ zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="rounded-xl p-6 max-w-sm w-full text-center shadow-2xl bg-card text-card-foreground">
            <div className="text-5xl mb-3">🌷</div>
            <h2 className="text-xl font-bold mb-2">Добро пожаловать!</h2>
            <p className="text-sm mb-4 text-muted-foreground">
              Ваш аккаунт успешно создан. Теперь вы можете оформлять заказы и добавлять товары в избранное.
            </p>
            <Button className="w-full rounded-full" onClick={handleGoHome}>
              В профиль →
            </Button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
