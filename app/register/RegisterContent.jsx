'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  if (password.length < 8) return 'Минимум 8 символов';
  if (!/[A-Za-zА-Яа-яЁё]/.test(password)) return 'Должна быть хотя бы одна буква';
  if (!/\d/.test(password)) return 'Должна быть хотя бы одна цифра';
  return '';
}

export default function RegisterContent() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const emailError = touched.email && !validateEmail(form.email) ? 'Введите корректный email' : '';
  const passwordError = touched.password ? validatePassword(form.password) : '';

  async function handleSubmit(e) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!validateEmail(form.email)) { setError('Введите корректный email'); return; }
    const pwdErr = validatePassword(form.password);
    if (pwdErr) { setError(pwdErr); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Аккаунт создан!');
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader className="text-center space-y-2">
            <div className="text-4xl">🌷</div>
            <h1 className="text-2xl font-bold">Создать аккаунт</h1>
            <p className="text-sm text-muted-foreground">Регистрация займёт минуту</p>
          </CardHeader>
          <CardContent>
            {error && <div className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Имя</Label>
                <Input id="name" autoComplete="name" placeholder="Ваше имя" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} onBlur={() => setTouched((t) => ({ ...t, email: true }))} className={emailError ? 'border-destructive' : ''} required />
                {emailError && <p className="text-xs text-destructive">{emailError}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input id="password" type="password" autoComplete="new-password" placeholder="Минимум 8 символов, буква и цифра" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} onBlur={() => setTouched((t) => ({ ...t, password: true }))} className={passwordError ? 'border-destructive' : ''} required />
                {passwordError && <p className="text-xs text-destructive">{passwordError}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Создаём...</> : 'Зарегистрироваться'}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Уже есть аккаунт? <Link href="/login" className="text-primary hover:underline">Войти</Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
