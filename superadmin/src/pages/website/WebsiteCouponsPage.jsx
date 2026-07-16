import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { superAdminApi } from '../../api/superadmin';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input, Label, Textarea, Select } from '../../components/ui/input';
import { StatusBadge } from '../../components/website/StatusBadge';

const EMPTY = {
  code: '', title: '', description: '', discountType: 'percent', discountValue: 10,
  minAmount: 0, maxDiscount: '', usageLimit: '', status: 'active', enabled: true,
};

export default function WebsiteCouponsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const { data } = useQuery({
    queryKey: ['website-coupons'],
    queryFn: () => superAdminApi.listWebsiteCoupons({ limit: 100 }).then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        code: String(form.code || '').toUpperCase(),
        discountValue: Number(form.discountValue) || 0,
        minAmount: Number(form.minAmount) || 0,
        maxDiscount: form.maxDiscount === '' ? null : Number(form.maxDiscount),
        usageLimit: form.usageLimit === '' ? null : Number(form.usageLimit),
      };
      return editingId
        ? superAdminApi.updateWebsiteCoupon(editingId, payload)
        : superAdminApi.createWebsiteCoupon(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['website-coupons'] });
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => superAdminApi.deleteWebsiteCoupon(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['website-coupons'] }),
  });

  const items = data?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader title="Coupons" description="Discount codes for trek bookings.">
        <Button onClick={() => setShowForm((v) => !v)}><Plus className="h-4 w-4" /> New Coupon</Button>
      </PageHeader>

      {showForm && (
        <Card className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div><Label>Code</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} /></div>
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div>
              <Label>Type</Label>
              <Select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
                <option value="percent">Percent</option>
                <option value="fixed">Fixed</option>
              </Select>
            </div>
            <div><Label>Value</Label><Input type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} /></div>
            <div><Label>Min Amount</Label><Input type="number" value={form.minAmount} onChange={(e) => setForm({ ...form, minAmount: e.target.value })} /></div>
            <div><Label>Max Discount</Label><Input type="number" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} /></div>
            <div><Label>Usage Limit</Label><Input type="number" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
                <option value="expired">Expired</option>
              </Select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={!form.code}>{editingId ? 'Update' : 'Create'}</Button>
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold">{item.code}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{item.title}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {item.discountType === 'percent' ? `${item.discountValue}%` : `₹${item.discountValue}`} · used {item.usedCount || 0}
                </p>
              </div>
              <StatusBadge status={item.status} />
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => { setEditingId(item.id); setForm({ ...EMPTY, ...item, maxDiscount: item.maxDiscount ?? '', usageLimit: item.usageLimit ?? '' }); setShowForm(true); }}>Edit</Button>
              <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(item.id)}>Delete</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
