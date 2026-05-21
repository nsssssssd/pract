'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Edit, Lock, CheckCircle, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import Loader from '@/components/Loader';
import { useMyOrders } from '@/hooks/useMyOrders';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_LABELS = { new: 'Новый', confirmed: 'Подтверждён', delivered: 'Доставлен', cancelled: 'Отменён' };
const STATUS_COLORS = { new: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };

function EditProfileForm({ user, onSave, onCancel }) {
  const [form, setForm] = useState({ name: user.name, email: user.email });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Введите имя'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('Введите корректный email'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), email: form.email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onSave(data); }, 1000);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
      {success && <div className="rounded-lg bg-green-100 px-3 py-2 text-sm text-green-800 flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Сохранено</div>}
      <div className="space-y-2">
        <Label>Имя</Label>
        <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input type="email" autoComplete="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Сохраняем...</> : 'Сохранить'}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Отмена</Button>
      </div>
    </form>
  );
}

function ChangePasswordForm({ onCancel }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.newPassword.length < 8) { setError('Новый пароль минимум 8 символов'); return; }
    if (!/[A-Za-zА-Яа-яЁё]/.test(form.newPassword)) { setError('Пароль должен содержать букву'); return; }
    if (!/\d/.test(form.newPassword)) { setError('Пароль должен содержать цифру'); return; }
    if (form.newPassword !== form.confirmPassword) { setError('Пароли не совпадают'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(true);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => { setSuccess(false); onCancel(); }, 1200);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
      {success && <div className="rounded-lg bg-green-100 px-3 py-2 text-sm text-green-800 flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Пароль изменён</div>}
      <div className="space-y-2">
        <Label>Текущий пароль</Label>
        <Input type="password" value={form.currentPassword} onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))} required />
      </div>
      <div className="space-y-2">
        <Label>Новый пароль</Label>
        <Input type="password" placeholder="Минимум 8 символов, буква и цифра" value={form.newPassword} onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))} required />
      </div>
      <div className="space-y-2">
        <Label>Повторите новый пароль</Label>
        <Input type="password" value={form.confirmPassword} onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))} required />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Меняем...</> : 'Изменить пароль'}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Отмена</Button>
      </div>
    </form>
  );
}

export default function ProfileContent({ initialUser }) {
  const [user, setUser] = useState(initialUser);
  const [activePanel, setActivePanel] = useState(null);
  const { data: orders, isLoading: ordersLoading } = useMyOrders();

  function handleProfileSaved(data) {
    setUser(data.user);
    setActivePanel(null);
    toast.success('Профиль обновлён');
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold mb-2">Доступ ограничен</h1>
        <p className="text-muted-foreground mb-6">Войдите в аккаунт, чтобы просматривать профиль</p>
        <Button onClick={() => window.location.href = '/login'}>Войти</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">{(user.name || '')[0]?.toUpperCase()}</div>
            <div className="flex-1">
              <div className="text-lg font-semibold">{user.name}</div>
              <div className="text-sm text-muted-foreground">{user.email || user.phone || ''}</div>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-2">
              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>{user.role === 'admin' ? '👑 Админ' : '🌷 Клиент'}</Badge>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="gap-1" onClick={() => setActivePanel((p) => p === 'edit' ? null : 'edit')}><Edit className="h-3 w-3" /> Редактировать</Button>
                <Button variant="outline" size="sm" className="gap-1" onClick={() => setActivePanel((p) => p === 'password' ? null : 'password')}><Lock className="h-3 w-3" /> Сменить пароль</Button>
                <Button variant="ghost" size="sm" className="gap-1 text-destructive hover:text-destructive md:hidden" onClick={async () => { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); window.location.href = '/'; }}><LogOut className="h-3 w-3" /> Выйти</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <AnimatePresence>
        {activePanel === 'edit' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <Card><CardContent className="p-6"><h3 className="text-lg font-semibold mb-4">Редактировать профиль</h3><EditProfileForm user={user} onSave={handleProfileSaved} onCancel={() => setActivePanel(null)} /></CardContent></Card>
          </motion.div>
        )}
        {activePanel === 'password' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <Card><CardContent className="p-6"><h3 className="text-lg font-semibold mb-4">Смена пароля</h3><ChangePasswordForm onCancel={() => setActivePanel(null)} /></CardContent></Card>
          </motion.div>
        )}
      </AnimatePresence>

      {user.role !== 'admin' && (
        <>
          <h2 className="text-xl font-bold">Мои заказы</h2>
          {ordersLoading ? <Loader /> : !orders || orders.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground"><div className="text-4xl mb-2">📦</div><p>Заказов пока нет</p></CardContent></Card>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <Card key={o.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Заказ #{String(o.id).slice(-6)}</span>
                      <Badge variant="outline" className={STATUS_COLORS[o.status]}>{STATUS_LABELS[o.status] || o.status}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-2">
                      {o.items.map((i) => (<span key={i.id} className="rounded-full bg-muted px-2 py-0.5">{i.name} × {i.qty}</span>))}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{new Date(o.createdAt).toLocaleDateString('ru-RU')}</span>
                      <span className="font-semibold">{o.total} ₽</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
