'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { Loader2, Plus, Pencil, Trash2, Package, Users, DollarSign, Bell, Shield, Upload, RefreshCw, FileSpreadsheet, Trash } from 'lucide-react';
import { toast } from 'sonner';
import Loader from '@/components/Loader';
import { useProducts } from '@/hooks/useProducts';
import { useOrders } from '@/hooks/useOrders';
import { useAdminStats } from '@/hooks/useAdminStats';
import { useAll1COrders } from '@/hooks/use1COrders';
import { useAdminUsers } from '@/hooks/useAdminUsers';

const STATUS_OPTIONS = ['new', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const C1_STATUS_LABELS = { 'Новый': 'Новый', 'В работе': 'В работе', 'Выполнен': 'Выполнен', 'Отменён': 'Отменён' };
const C1_STATUS_COLORS = { 'Новый': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', 'В работе': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', 'Выполнен': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', 'Отменён': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
const STATUS_LABELS = { new: 'Новый', confirmed: 'Подтверждён', processing: 'В обработке', shipped: 'Отправлен', delivered: 'Доставлен', cancelled: 'Отменён' };
const STATUS_COLORS = { new: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', processing: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', shipped: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200', delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };

export default function AdminContent() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [productForm, setProductForm] = useState({ name: '', description: '', price: '', unit: 'шт', emoji: '🌷', color: '#F4A7B9', image: null });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [ordersTab, setOrdersTab] = useState('site'); // 'site' | '1c'
  const [importTab, setImportTab] = useState('upload'); // 'upload' | 'history' | 'cron'

  const { data: products, isLoading: productsLoading, refetch: refetchProducts } = useProducts();
  const { data: orders, isLoading: ordersLoading, refetch: refetchOrders } = useOrders();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: c1OrdersData, isLoading: c1OrdersLoading, refetch: refetchC1Orders } = useAll1COrders();
  const { data: users, refetch: refetchUsers } = useAdminUsers();

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => { if (!u || u.role !== 'admin') { router.push('/'); return; } setUser(u); });
  }, [router]);

  async function updateOrderStatus(id, status) {
    try {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Ошибка');
      toast.success('Статус обновлён');
    } catch { toast.error('Ошибка обновления статуса'); }
  }

  async function deleteProduct(id) {
    if (!confirm('Удалить товар?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Ошибка');
      refetchProducts();
      toast.success('Товар удалён');
    } catch { toast.error('Ошибка удаления'); }
  }

  async function deleteUser(id) {
    if (!confirm('Удалить пользователя?')) return;
    try {
      const res = await fetch(`/api/auth/users/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Ошибка');
      refetchUsers();
      toast.success('Пользователь удалён');
    } catch { toast.error('Ошибка удаления'); }
  }

  async function sync1CStatus() {
    try {
      const res = await fetch('/api/orders/1c/sync', { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message);
      refetchOrders();
    } catch (err) {
      toast.error(err.message || 'Ошибка синхронизации');
    }
  }

  async function updateUserRole(id, role) {
    try {
      const res = await fetch(`/api/auth/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error('Ошибка');
      refetchUsers();
      toast.success(role === 'admin' ? 'Роль повышена до админа' : 'Роль понижена до клиента');
    } catch { toast.error('Ошибка изменения роли'); }
  }

  async function saveProduct(e) {
    e.preventDefault();
    setSavingProduct(true);
    try {
      let imageUrl = productForm.image ?? null;
      if (imageFile) {
        const fd = new FormData();
        fd.append('image', imageFile);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Ошибка загрузки фото');
        imageUrl = data.url;
      }
      const payload = { ...productForm, image: imageUrl };
      if (editingProduct) {
        const res = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const updated = await res.json();
        if (!res.ok) throw new Error(updated.error);
        refetchProducts();
        toast.success('Товар обновлён');
      } else {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const created = await res.json();
        if (!res.ok) throw new Error(created.error);
        refetchProducts();
        toast.success('Товар создан');
      }
      setShowProductForm(false);
      setEditingProduct(null);
      setProductForm({ name: '', description: '', price: '', unit: 'шт', emoji: '🌷', color: '#F4A7B9', image: null });
      setImageFile(null);
      setImagePreview(null);
    } catch (err) {
      toast.error(err.message);
    }
    setSavingProduct(false);
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function startEdit(p) {
    setEditingProduct(p);
    setProductForm({ name: p.name, description: p.description, price: p.price, unit: p.unit, emoji: p.emoji, color: p.color, image: p.image || null });
    setImageFile(null);
    setImagePreview(p.image || null);
    setShowProductForm(true);
  }

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs defaultValue="stats" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:w-fit md:grid-cols-5">
          <TabsTrigger value="stats">Статистика</TabsTrigger>
          <TabsTrigger value="orders">Заказы</TabsTrigger>
          <TabsTrigger value="products">Товары</TabsTrigger>
          <TabsTrigger value="users">Пользователи</TabsTrigger>
          <TabsTrigger value="import">Импорт</TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="space-y-6">
          {statsLoading || !stats ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { icon: Package, label: 'Всего заказов', value: stats.totalOrders },
                  { icon: Bell, label: 'Новых заказов', value: stats.newOrders, color: 'text-yellow-600' },
                  { icon: DollarSign, label: 'Выручка', value: stats.totalRevenue.toLocaleString() + ' ₽', color: 'text-green-600' },
                  { icon: Users, label: 'Клиентов', value: stats.totalUsers },
                  { icon: Package, label: 'Товаров', value: stats.totalProducts },
                ].map((s) => (
                  <Card key={s.label}>
                    <CardContent className="p-4 flex flex-col items-center text-center gap-1">
                      <s.icon className={`h-5 w-5 ${s.color || 'text-muted-foreground'}`} />
                      <div className={`text-xl font-bold ${s.color || ''}`}>{s.value}</div>
                      <div className="text-xs text-muted-foreground">{s.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <h3 className="text-lg font-semibold">Последние заказы</h3>
              <div className="rounded-lg border overflow-hidden hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Клиент</TableHead>
                      <TableHead>Сумма</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Дата</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(orders || []).slice(0, 5).map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-mono text-xs">#{String(o.id).slice(-6)}</TableCell>
                        <TableCell>{o.name}</TableCell>
                        <TableCell className="font-medium">{o.total} ₽</TableCell>
                        <TableCell><Badge variant="outline" className={STATUS_COLORS[o.status]}>{STATUS_LABELS[o.status]}</Badge></TableCell>
                        <TableCell className="text-muted-foreground text-xs">{new Date(o.createdAt).toLocaleDateString('ru-RU')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="md:hidden space-y-3">
                {(orders || []).slice(0, 5).map((o) => (
                  <Card key={o.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between mb-1">
                        <span className="font-mono text-xs">#{String(o.id).slice(-6)}</span>
                        <Badge variant="outline" className={STATUS_COLORS[o.status]}>{STATUS_LABELS[o.status]}</Badge>
                      </div>
                      <div className="font-medium">{o.name}</div>
                      <div className="flex justify-between mt-1 text-sm">
                        <span className="text-muted-foreground">{new Date(o.createdAt).toLocaleDateString('ru-RU')}</span>
                        <span className="font-semibold">{o.total} ₽</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              Заказы
              <Badge variant="secondary" className="ml-2">
                {ordersTab === 'site' ? (orders || []).length : (c1OrdersData?.orders || []).length}
              </Badge>
            </h2>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border bg-card p-1 gap-1">
                <button
                  onClick={() => setOrdersTab('site')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${ordersTab === 'site' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  На сайте
                </button>
                <button
                  onClick={() => setOrdersTab('1c')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${ordersTab === '1c' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  1С:УНФ
                </button>
              </div>
              {ordersTab === '1c' && (
                <Button size="sm" variant="outline" onClick={sync1CStatus}>
                  🔄 Синхронизировать
                </Button>
              )}
            </div>
          </div>

          {ordersTab === 'site' ? (
            ordersLoading ? <Loader /> : (
              <>
                <div className="rounded-lg border overflow-hidden hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Клиент</TableHead>
                        <TableHead>Телефон</TableHead>
                        <TableHead>Товары</TableHead>
                        <TableHead>Сумма</TableHead>
                        <TableHead>Статус</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(orders || []).map((o) => (
                        <TableRow key={o.id}>
                          <TableCell className="font-mono text-xs">
                            #{String(o.id).slice(-6)}
                            {o.number1C && <div className="text-xs text-muted-foreground">1С: {o.number1C}</div>}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{o.name}</div>
                            <div className="text-xs text-muted-foreground">{o.address}</div>
                          </TableCell>
                          <TableCell className="text-sm">{o.phone}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {o.items.map((i) => (
                                <span key={i.id} className="text-xs bg-muted rounded px-1.5 py-0.5">{i.name} ×{i.qty}</span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{o.total} ₽</TableCell>
                          <TableCell>
                            <Select value={o.status} onValueChange={(v) => updateOrderStatus(o.id, v)}>
                              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {STATUS_OPTIONS.map((s) => (
                                  <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="md:hidden space-y-3">
                  {(orders || []).map((o) => (
                    <Card key={o.id}>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="font-mono text-xs">#{String(o.id).slice(-6)}</span>
                          <span className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString('ru-RU')}</span>
                        </div>
                        {o.number1C && <div className="text-xs text-muted-foreground">1С: {o.number1C}</div>}
                        <div className="font-medium">{o.name}</div>
                        <div className="text-sm text-muted-foreground">{o.phone}</div>
                        <div className="text-sm text-muted-foreground">{o.address}</div>
                        <div className="flex flex-wrap gap-1">
                          {o.items.map((i) => (
                            <span key={i.id} className="text-xs bg-muted rounded px-1.5 py-0.5">{i.name} ×{i.qty}</span>
                          ))}
                        </div>
                        <div className="flex justify-between items-center pt-1">
                          <Select value={o.status} onValueChange={(v) => updateOrderStatus(o.id, v)}>
                            <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((s) => (
                                <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span className="font-semibold">{o.total} ₽</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )
          ) : (
            c1OrdersLoading ? <Loader /> : !c1OrdersData?.orders || c1OrdersData.orders.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <div className="text-4xl mb-2">📋</div>
                  <p>Заказов в 1С не найдено</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="rounded-lg border overflow-hidden hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Номер 1С</TableHead>
                        <TableHead>Клиент</TableHead>
                        <TableHead>Телефон</TableHead>
                        <TableHead>Товары</TableHead>
                        <TableHead>Сумма</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead>Дата</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {c1OrdersData.orders.map((o) => (
                        <TableRow key={o.number}>
                          <TableCell className="font-mono text-xs">{o.number}</TableCell>
                          <TableCell>
                            <div className="font-medium">{o.clientName}</div>
                          </TableCell>
                          <TableCell className="text-sm">{o.clientPhone}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {o.items.map((i, idx) => (
                                <span key={idx} className="text-xs bg-muted rounded px-1.5 py-0.5">{i.name} ×{i.quantity}</span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{o.total.toLocaleString('ru-RU')} ₽</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={C1_STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-800'}>
                              {C1_STATUS_LABELS[o.status] || o.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">{o.date ? new Date(o.date).toLocaleDateString('ru-RU') : '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="md:hidden space-y-3">
                  {c1OrdersData.orders.map((o) => (
                    <Card key={o.number}>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="font-mono text-xs">{o.number}</span>
                          <span className="text-xs text-muted-foreground">{o.date ? new Date(o.date).toLocaleDateString('ru-RU') : '—'}</span>
                        </div>
                        <div className="font-medium">{o.clientName}</div>
                        <div className="text-sm text-muted-foreground">{o.clientPhone}</div>
                        <div className="flex flex-wrap gap-1">
                          {o.items.map((i, idx) => (
                            <span key={idx} className="text-xs bg-muted rounded px-1.5 py-0.5">{i.name} ×{i.quantity}</span>
                          ))}
                        </div>
                        <div className="flex justify-between items-center pt-1">
                          <Badge variant="outline" className={C1_STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-800'}>
                            {C1_STATUS_LABELS[o.status] || o.status}
                          </Badge>
                          <span className="font-semibold">{o.total.toLocaleString('ru-RU')} ₽</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )
          )}
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Товары <Badge variant="secondary">{(products || []).length}</Badge></h2>
            <Dialog open={showProductForm} onOpenChange={setShowProductForm}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1" onClick={() => {
                  setEditingProduct(null);
                  setProductForm({ name: '', description: '', price: '', unit: 'шт', emoji: '🌷', color: '#F4A7B9', image: null });
                  setImageFile(null); setImagePreview(null);
                }}>
                  <Plus className="h-4 w-4" /> Добавить
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingProduct ? 'Редактировать товар' : 'Новый товар'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={saveProduct} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Название</Label>
                      <Input value={productForm.name} onChange={(e) => setProductForm((f) => ({ ...f, name: e.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Цена (₽)</Label>
                      <Input type="number" value={productForm.price} onChange={(e) => setProductForm((f) => ({ ...f, price: e.target.value }))} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Описание</Label>
                    <Input value={productForm.description} onChange={(e) => setProductForm((f) => ({ ...f, description: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label>Единица</Label>
                      <Select value={productForm.unit} onValueChange={(v) => setProductForm((f) => ({ ...f, unit: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="шт">Штучно</SelectItem>
                          <SelectItem value="букет">Букет</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Эмодзи</Label>
                      <Input value={productForm.emoji} onChange={(e) => setProductForm((f) => ({ ...f, emoji: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Цвет</Label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={productForm.color} onChange={(e) => setProductForm((f) => ({ ...f, color: e.target.value }))} className="h-9 w-9 rounded border" />
                        <span className="text-xs text-muted-foreground">{productForm.color}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Фото</Label>
                    <div className="flex items-center gap-3">
                      {imagePreview ? (
                        <div className="relative">
                          <Image src={imagePreview} alt="preview" width={80} height={80} className="rounded-lg object-cover" loading="lazy" />
                          <Button type="button" variant="destructive" size="sm" className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full" onClick={() => { setImageFile(null); setImagePreview(null); setProductForm((f) => ({ ...f, image: null })); }}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border border-dashed hover:bg-accent">
                          <Plus className="h-5 w-5 text-muted-foreground" />
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                        </Label>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={savingProduct}>
                      {savingProduct ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Сохраняем...</> : (editingProduct ? 'Сохранить' : 'Создать')}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowProductForm(false)}>Отмена</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(products || []).map((p) => (
              <Card key={p.id} className="overflow-hidden">
                <div className="aspect-square relative flex items-center justify-center" style={{ background: p.color + '22' }}>
                  {p.image ? (
                    <Image src={p.image} alt={p.name} fill className="object-cover" loading="lazy" />
                  ) : (
                    <span className="text-5xl">{p.emoji}</span>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm text-muted-foreground">{p.price} ₽ / {p.unit}</div>
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" className="gap-1" onClick={() => startEdit(p)}>
                      <Pencil className="h-3 w-3" /> Изменить
                    </Button>
                    <Button variant="destructive" size="sm" className="gap-1" onClick={() => deleteProduct(p.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <h2 className="text-xl font-bold">Пользователи <Badge variant="secondary">{(users || []).length}</Badge></h2>
          <div className="rounded-lg border overflow-hidden hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Имя</TableHead>
                  <TableHead>Email / Телефон</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead className="w-24">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(users || []).map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{(u.name || '?')[0]?.toUpperCase()}</span>
                        <span className="font-medium">{u.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{u.email || u.phone || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                        {u.role === 'admin' ? '👑 Админ' : '🌷 Клиент'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{new Date(u.createdAt).toLocaleDateString('ru-RU')}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => updateUserRole(u.id, u.role === 'admin' ? 'user' : 'admin')} title={u.role === 'admin' ? 'Понизить до клиента' : 'Сделать админом'}>
                          <Shield className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => deleteUser(u.id)} title="Удалить">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="md:hidden space-y-3">
            {(users || []).map((u) => (
              <Card key={u.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{(u.name || '?')[0]?.toUpperCase()}</span>
                    <div className="flex-1">
                      <div className="font-medium">{u.name}</div>
                      <div className="text-xs text-muted-foreground">{u.email || u.phone || '—'}</div>
                      <div className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString('ru-RU')}</div>
                    </div>
                    <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>{u.role === 'admin' ? '👑' : '🌷'}</Badge>
                  </div>
                  <div className="flex gap-2 pt-2 border-t">
                    <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => updateUserRole(u.id, u.role === 'admin' ? 'user' : 'admin')}>
                      <Shield className="h-3 w-3" />
                      {u.role === 'admin' ? 'Понизить' : 'Админ'}
                    </Button>
                    <Button variant="destructive" size="sm" className="flex-1 gap-1" onClick={() => deleteUser(u.id)}>
                      <Trash2 className="h-3 w-3" /> Удалить
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <ImportTab products={products} refetchProducts={refetchProducts} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ImportTab({ products, refetchProducts }) {
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState('append');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [cronLoading, setCronLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('upload');

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/admin/import/history', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.files || []);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    }
    setHistoryLoading(false);
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) {
      toast.error('Выберите файл');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append('price_file', file);
      const res = await fetch(`/api/admin/import?mode=${mode}`, {
        method: 'POST',
        body: fd,
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка импорта');
      setResult(data);
      toast.success(`Импортировано ${data.imported}, обновлено ${data.updated}`);
      refetchProducts();
      loadHistory();
      setFile(null);
    } catch (err) {
      toast.error(err.message);
    }
    setLoading(false);
  }

  async function handleDeleteFile(name) {
    if (!confirm(`Удалить файл ${name}?`)) return;
    try {
      const res = await fetch(`/api/admin/import/history?name=${encodeURIComponent(name)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Ошибка удаления');
      toast.success('Файл удалён');
      loadHistory();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleCronTrigger() {
    setCronLoading(true);
    try {
      const res = await fetch('/api/admin/import/cron/trigger', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка запуска');
      toast.success(`Cron выполнен: импортировано ${data.imported || 0}, обновлено ${data.updated || 0}`);
      refetchProducts();
      loadHistory();
    } catch (err) {
      toast.error(err.message);
    }
    setCronLoading(false);
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 Б';
    const k = 1024;
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Импорт прайсов</h2>
        <div className="flex rounded-lg border bg-card p-1 gap-1">
          <button
            onClick={() => setActiveSubTab('upload')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${activeSubTab === 'upload' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Загрузка
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${activeSubTab === 'history' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            История
          </button>
          <button
            onClick={() => setActiveSubTab('cron')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${activeSubTab === 'cron' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Cron
          </button>
        </div>
      </div>

      {activeSubTab === 'upload' && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <Label>Файл прайса</Label>
                <div className="flex items-center gap-3">
                  <Label className="flex h-24 w-full cursor-pointer items-center justify-center rounded-lg border border-dashed hover:bg-accent">
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <Upload className="h-6 w-6" />
                      <span className="text-sm">{file ? file.name : 'Нажмите или перетащите файл'}</span>
                      <span className="text-xs">CSV, XLSX, XLS (до 100 МБ)</span>
                    </div>
                    <input
                      type="file"
                      accept=".csv,.xls,.xlsx"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files[0])}
                    />
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Режим импорта</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('append')}
                    className={`flex-1 px-3 py-2 text-sm rounded-md border transition-colors ${mode === 'append' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'}`}
                  >
                    Добавить к существующему
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('replace')}
                    className={`flex-1 px-3 py-2 text-sm rounded-md border transition-colors ${mode === 'replace' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'}`}
                  >
                    Заменить каталог
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={loading || !file} className="gap-1">
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Импортируем...</> : <><Upload className="h-4 w-4" /> Загрузить и импортировать</>}
              </Button>
            </form>

            {result && (
              <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 space-y-1">
                <div className="font-medium text-green-800 dark:text-green-200">Импорт завершён</div>
                <div className="text-sm text-green-700 dark:text-green-300">
                  Импортировано: <strong>{result.imported}</strong>, Обновлено: <strong>{result.updated}</strong>, Пропущено: <strong>{result.skipped}</strong>
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">
                  Всего товаров в каталоге: {result.total}
                </div>
                {result.errors?.length > 0 && (
                  <div className="text-xs text-red-600 dark:text-red-400 mt-2">
                    Ошибки: {result.errors.join(', ')}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeSubTab === 'history' && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">История загрузок</h3>
            {historyLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Нет загруженных файлов</p>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Файл</TableHead>
                      <TableHead>Размер</TableHead>
                      <TableHead>Дата</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((f) => (
                      <TableRow key={f.name}>
                        <TableCell className="font-mono text-xs">{f.name}</TableCell>
                        <TableCell className="text-sm">{formatBytes(f.size)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(f.date).toLocaleString('ru-RU')}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => handleDeleteFile(f.name)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeSubTab === 'cron' && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Автоматическое обновление</h3>
            <p className="text-sm text-muted-foreground">
              Настройте источники в коде (app/api/admin/import/cron/route.js) и запустите ручное обновление для проверки.
            </p>
            <Button onClick={handleCronTrigger} disabled={cronLoading} className="gap-1">
              {cronLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Выполняется...</> : <><RefreshCw className="h-4 w-4" /> Запустить cron-обновление</>}
            </Button>
            <div className="text-xs text-muted-foreground">
              <p>Linux cron: <code className="bg-muted px-1 rounded">0 19 * * * curl -s &quot;https://tulpanomsk55.ru/api/admin/import/cron?key=CRON_SECRET_KEY&quot;</code></p>
              <p className="mt-1">Windows: используйте Task Scheduler или setup-windows-task.bat</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
