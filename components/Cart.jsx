'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/store/cart';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import {
  Minus,
  Plus,
  ArrowLeft,
  Loader2,
  ShieldAlert,
  CreditCard,
  Banknote,
  Trash2,
  ShoppingBag,
  CheckCircle2,
  MapPin,
  Phone,
  User,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';

function validatePhone(phone) {
  const cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.length !== 11) return 'Телефон должен содержать 11 цифр';
  if (!['7', '8'].includes(cleaned[0])) return 'Телефон должен начинаться с 7 или 8';
  return '';
}

const STEPS = [
  { key: 'cart', label: 'Корзина', icon: ShoppingBag },
  { key: 'form', label: 'Доставка', icon: MapPin },
  { key: 'success', label: 'Готово', icon: CheckCircle2 },
];

export default function Cart() {
  const items = useCartStore((s) => s.items);
  const isOpen = useCartStore((s) => s.isOpen);
  const closeCart = useCartStore((s) => s.closeCart);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const total = useCartStore(useCallback((s) => s.total(), []));

  const [user, setUser] = useState(null);
  const [step, setStep] = useState('cart');
  const [loading, setLoading] = useState(false);
  const [lastOrderId, setLastOrderId] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [formErrors, setFormErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showPaymentMock, setShowPaymentMock] = useState(false);
  const [sheetSide, setSheetSide] = useState('right');
  const router = useRouter();

  useEffect(() => {
    const check = () => setSheetSide(window.innerWidth < 768 ? 'bottom' : 'right');
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/auth/me', { credentials: 'include' })
        .then((r) => (r.ok ? r.json() : null))
        .then((u) => {
          setUser(u);
          setForm((f) => ({ ...f, name: u?.name || '' }));
        });
      setStep('cart');
      setLastOrderId(null);
      setFormErrors({});
      setShowPaymentMock(false);
    }
  }, [isOpen]);

  function validateForm() {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Введите имя';
    const phoneError = validatePhone(form.phone);
    if (phoneError) errors.phone = phoneError;
    if (!form.address.trim()) errors.address = 'Введите адрес';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleOrder(e) {
    e.preventDefault();
    if (!validateForm()) return;
    if (paymentMethod === 'card') {
      setShowPaymentMock(true);
      return;
    }
    await submitOrder();
  }

  async function submitOrder() {
    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          userId: user?.id || null,
          items: items.map((i) => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      clearCart();
      setLastOrderId(data.orderId);
      setStep('success');
      toast.success('Заказ оформлен!');
    } catch (err) {
      toast.error(err.message);
    }
    setLoading(false);
  }

  async function handleMockPayment() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setShowPaymentMock(false);
    await submitOrder();
  }

  const isAdmin = user?.role === 'admin';
  const currentStepIdx = STEPS.findIndex((s) => s.key === step);

  return (
    <Sheet open={isOpen} onOpenChange={closeCart}>
      <SheetContent
        side={sheetSide}
        className={`w-full flex flex-col ${
          sheetSide === 'bottom' ? 'h-[90vh] rounded-t-3xl' : 'sm:max-w-lg'
        }`}
      >
        {/* Progress */}
        {step !== 'success' && !showPaymentMock && (
          <div className="px-1 pt-2 pb-1">
            <div className="flex items-center justify-between">
              {STEPS.slice(0, 2).map((s, i) => {
                const Icon = s.icon;
                const isActive = currentStepIdx >= i;
                return (
                  <div key={s.key} className="flex items-center gap-2 flex-1">
                    <div
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {s.label}
                    </div>
                    {i === 0 && (
                      <div className={`h-0.5 flex-1 rounded-full ${isActive ? 'bg-primary/30' : 'bg-muted'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <SheetHeader className="pb-2">
          <SheetTitle>
            {step === 'success'
              ? 'Заказ оформлен'
              : showPaymentMock
              ? 'Оплата'
              : step === 'form'
              ? 'Оформление заказа'
              : `Корзина (${items.length})`}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-2">
          <AnimatePresence mode="wait">
            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center gap-5 text-center py-10"
              >
                <div className="relative">
                  <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="absolute -top-1 -right-1 text-2xl"
                  >
                    🌷
                  </motion.div>
                </div>
                <div>
                  <div className="text-xl font-bold">Спасибо за заказ!</div>
                  <p className="text-muted-foreground text-sm mt-1">
                    Мы свяжемся с вами для подтверждения доставки
                  </p>
                </div>
                {lastOrderId && (
                  <div className="bg-muted rounded-xl px-4 py-2 text-sm font-mono">
                    Заказ <span className="font-bold">#{String(lastOrderId).slice(-6)}</span>
                  </div>
                )}
                <div className="flex flex-col gap-2 w-full max-w-xs">
                  {user ? (
                    <Link href="/profile" onClick={closeCart} className="w-full">
                      <Button variant="outline" className="w-full rounded-full">Мои заказы</Button>
                    </Link>
                  ) : (
                    <Link href="/login" onClick={closeCart} className="w-full">
                      <Button variant="outline" className="w-full rounded-full">Войти для отслеживания</Button>
                    </Link>
                  )}
                  <Button onClick={closeCart} className="w-full rounded-full">Продолжить покупки</Button>
                </div>
              </motion.div>
            )}

            {showPaymentMock && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-4"
              >
                <Button type="button" variant="ghost" size="sm" className="w-fit gap-1 rounded-full" onClick={() => setShowPaymentMock(false)}>
                  <ArrowLeft className="h-4 w-4" /> Назад
                </Button>
                <div className="rounded-2xl border bg-card p-6 space-y-5">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <CreditCard className="h-5 w-5 text-primary" /> Оплата картой
                  </div>
                  <div className="text-sm text-muted-foreground">
                    К оплату: <span className="font-bold text-foreground text-lg">{total} ₽</span>
                  </div>
                  <div className="space-y-2">
                    <Label>Номер карты</Label>
                    <Input placeholder="0000 0000 0000 0000" defaultValue="4242 4242 4242 4242" className="rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Срок</Label>
                      <Input placeholder="MM/YY" defaultValue="12/26" className="rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label>CVC</Label>
                      <Input placeholder="123" defaultValue="123" className="rounded-xl" />
                    </div>
                  </div>
                  <Button className="w-full rounded-full h-12" onClick={handleMockPayment} disabled={loading}>
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Обработка...</> : `Оплатить ${total} ₽`}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">Демо-режим: реальные деньги не списываются</p>
                </div>
              </motion.div>
            )}

            {step === 'cart' && !showPaymentMock && (
              <motion.div
                key="cart"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col h-full"
              >
                {items.length === 0 ? (
                  <div className="flex flex-col items-center gap-5 text-center py-14">
                    <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center text-5xl">🌷</div>
                    <div>
                      <div className="text-lg font-semibold">Ваша корзина пуста</div>
                      <p className="text-muted-foreground text-sm mt-1 max-w-[240px]">
                        Добавьте свежие тюльпаны — они ждут вас в каталоге
                      </p>
                    </div>
                    <Button onClick={closeCart} className="rounded-full px-6">
                      В каталог
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3">
                      {items.map((item, i) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-3 rounded-2xl border p-3 bg-card"
                        >
                          <div
                            className="flex h-12 w-12 items-center justify-center rounded-xl text-xl shrink-0"
                            style={{ background: item.color + '22' }}
                          >
                            {item.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{item.name}</div>
                            <div className="text-xs text-muted-foreground">{item.price} ₽ / шт</div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => updateQuantity(item.id, item.qty - 1)} aria-label="Уменьшить">
                              <Minus className="h-3 w-3" aria-hidden="true" />
                            </Button>
                            <span className="w-7 text-center text-sm font-medium">{item.qty}</span>
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => updateQuantity(item.id, item.qty + 1)} aria-label="Увеличить">
                              <Plus className="h-3 w-3" aria-hidden="true" />
                            </Button>
                          </div>
                          <div className="text-sm font-semibold min-w-[60px] text-right">
                            {item.price * item.qty} ₽
                          </div>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.id)} aria-label="Удалить">
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </motion.div>
                      ))}
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Товары ({items.reduce((s, i) => s + i.qty, 0)})</span>
                        <span>{total} ₽</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Доставка</span>
                        <span className="text-green-600 font-medium">Бесплатно</span>
                      </div>
                      <div className="flex items-center justify-between text-lg font-bold pt-2 border-t">
                        <span>Итого</span>
                        <span className="text-primary">{total} ₽</span>
                      </div>
                    </div>

                    {isAdmin ? (
                      <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 shrink-0" />
                        Администраторы не могут оформлять заказы
                      </div>
                    ) : (
                      <Button
                        className="w-full h-12 rounded-full text-base"
                        onClick={() => {
                          if (user) setStep('form');
                          else {
                            closeCart();
                            router.push('/register');
                          }
                        }}
                      >
                        Оформить заказ →
                      </Button>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {step === 'form' && !showPaymentMock && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-4"
              >
                <Button type="button" variant="ghost" size="sm" className="w-fit gap-1 rounded-full" onClick={() => setStep('cart')}>
                  <ArrowLeft className="h-4 w-4" /> Назад в корзину
                </Button>

                {/* Order summary */}
                <div className="rounded-2xl border bg-muted/40 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                    <Package className="h-4 w-4" /> Состав заказа
                  </div>
                  {items.map((i) => (
                    <div key={i.id} className="flex items-center justify-between text-sm">
                      <span className="truncate">{i.name} × {i.qty}</span>
                      <span className="font-medium">{i.price * i.qty} ₽</span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex items-center justify-between font-bold">
                    <span>К оплате</span>
                    <span className="text-primary">{total} ₽</span>
                  </div>
                </div>

                <form onSubmit={handleOrder} className="flex flex-col gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cart-name" className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-muted-foreground" /> Ваше имя
                    </Label>
                    <Input id="cart-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={`rounded-xl ${formErrors.name ? 'border-destructive' : ''}`} placeholder="Иван" required />
                    {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cart-phone" className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Телефон
                    </Label>
                    <Input id="cart-phone" type="tel" placeholder="89991234567" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={`rounded-xl ${formErrors.phone ? 'border-destructive' : ''}`} required />
                    {formErrors.phone ? <p className="text-xs text-destructive">{formErrors.phone}</p> : <p className="text-xs text-muted-foreground">Формат: 89991234567</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cart-address" className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Адрес доставки
                    </Label>
                    <Input id="cart-address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className={`rounded-xl ${formErrors.address ? 'border-destructive' : ''}`} placeholder="ул. Ленина, 1, кв. 10" required />
                    {formErrors.address && <p className="text-xs text-destructive">{formErrors.address}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Способ оплаты</Label>
                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="flex flex-col gap-2">
                      <div className="flex items-center space-x-3 rounded-xl border p-3 cursor-pointer hover:bg-accent transition-colors">
                        <RadioGroupItem value="cash" id="cash" />
                        <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer font-normal">
                          <Banknote className="h-4 w-4 text-primary" /> Наличными при получении
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 rounded-xl border p-3 cursor-pointer hover:bg-accent transition-colors">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer font-normal">
                          <CreditCard className="h-4 w-4 text-primary" /> Картой онлайн
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full h-12 rounded-full text-base mt-1">
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Оформляем...</> : paymentMethod === 'card' ? `Перейти к оплате ${total} ₽` : `Заказать на ${total} ₽`}
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
}
