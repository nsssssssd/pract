'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Minus, Plus, ArrowLeft, Loader2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

function validatePhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length !== 11) return 'Телефон должен содержать 11 цифр';
  if (!['7', '8'].includes(cleaned[0])) return 'Телефон должен начинаться с 7 или 8';
  return '';
}

export default function Cart() {
  const items = useCartStore((s) => s.items);
  const isOpen = useCartStore((s) => s.isOpen);
  const closeCart = useCartStore((s) => s.closeCart);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const total = useCartStore((s) => s.total());

  const [user, setUser] = useState(null);
  const [step, setStep] = useState('cart');
  const [loading, setLoading] = useState(false);
  const [lastOrderId, setLastOrderId] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [formErrors, setFormErrors] = useState({});
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      fetch('/api/auth/me')
        .then((r) => (r.ok ? r.json() : null))
        .then((u) => {
          setUser(u);
          setForm((f) => ({ ...f, name: u?.name || '' }));
        });
      setStep('cart');
      setLastOrderId(null);
      setFormErrors({});
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

  const isAdmin = user?.role === 'admin';

  return (
    <Sheet open={isOpen} onOpenChange={closeCart}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>
            {step === 'success'
              ? '🎉 Заказ оформлен'
              : step === 'form'
              ? 'Оформление'
              : '🛒 Корзина'}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {step === 'success' && (
            <div className="flex flex-col items-center gap-4 text-center py-8">
              <div className="text-5xl">🌷</div>
              <div className="text-xl font-semibold">Спасибо за заказ!</div>
              <div className="text-muted-foreground text-sm">
                Мы свяжемся с вами для подтверждения доставки
              </div>
              {lastOrderId && (
                <div className="text-sm font-medium">
                  Заказ #{String(lastOrderId).slice(-6)}
                </div>
              )}
              {user ? (
                <Link href="/profile" onClick={closeCart}>
                  <Button variant="link">Посмотреть мои заказы →</Button>
                </Link>
              ) : (
                <Link href="/login" onClick={closeCart}>
                  <Button variant="link">Войдите, чтобы отслеживать заказы →</Button>
                </Link>
              )}
              <Button onClick={closeCart} className="mt-2">Продолжить покупки</Button>
            </div>
          )}

          {step === 'cart' && (
            <>
              {items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 text-center py-12 text-muted-foreground">
                  <ShoppingCartIcon className="h-10 w-10 opacity-50" />
                  <p>Корзина пуста</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-lg border p-3"
                      >
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-md text-lg shrink-0"
                          style={{ background: item.color + '33' }}
                        >
                          {item.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{item.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.price * item.qty} ₽
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.id, item.qty - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-sm">{item.qty}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.id, item.qty + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t pt-4">
                    <span className="font-medium">Итого</span>
                    <span className="text-lg font-bold">{total} ₽</span>
                  </div>
                  {isAdmin ? (
                    <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 shrink-0" />
                      Администраторы не могут оформлять заказы
                    </div>
                  ) : (
                    <Button
                      onClick={() => {
                        if (user) {
                          setStep('form');
                        } else {
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
            </>
          )}

          {step === 'form' && (
            <form onSubmit={handleOrder} className="flex flex-col gap-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-fit gap-1"
                onClick={() => setStep('cart')}
              >
                <ArrowLeft className="h-4 w-4" />
                Назад
              </Button>

              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {items.map((i) => (
                  <span key={i.id} className="rounded-full bg-muted px-2 py-1">
                    {i.name} × {i.qty}
                  </span>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cart-name">Ваше имя</Label>
                <Input
                  id="cart-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className={formErrors.name ? 'border-destructive' : ''}
                  required
                />
                {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cart-phone">Телефон</Label>
                <Input
                  id="cart-phone"
                  type="tel"
                  placeholder="89991234567"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className={formErrors.phone ? 'border-destructive' : ''}
                  required
                />
                {formErrors.phone ? (
                  <p className="text-xs text-destructive">{formErrors.phone}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Формат: 89991234567</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cart-address">Адрес доставки</Label>
                <Input
                  id="cart-address"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  className={formErrors.address ? 'border-destructive' : ''}
                  required
                />
                {formErrors.address && <p className="text-xs text-destructive">{formErrors.address}</p>}
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <span className="font-medium">К оплате</span>
                <span className="text-lg font-bold">{total} ₽</span>
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Оформляем...
                  </>
                ) : (
                  `Заказать на ${total} ₽`
                )}
              </Button>
            </form>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ShoppingCartIcon({ className }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}
