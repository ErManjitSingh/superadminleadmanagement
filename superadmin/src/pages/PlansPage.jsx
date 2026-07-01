import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { superAdminApi } from '../api/superadmin';
import { PageHeader } from '../components/shared/PageHeader';
import { Button } from '../components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input, Label } from '../components/ui/input';
import { formatCurrency } from '../lib/utils';

const MODULES = ['crm', 'bookings', 'packages', 'hotels', 'transport', 'reports', 'calendar', 'whatsapp', 'email', 'api', 'payments', 'invoices'];

export default function PlansPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', slug: '', description: '', monthlyPrice: 0, yearlyPrice: 0,
    userLimit: 10, storageLimitGb: 10, leadLimit: 5000, trialDays: 14,
    whatsappLimit: 0, apiCallLimit: 0, customDomainLimit: 1, features: ['crm', 'bookings', 'packages'],
  });

  const { data, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => superAdminApi.listPlans().then((r) => r.data.data),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }) => superAdminApi.updatePlan(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plans'] }),
  });

  const createMutation = useMutation({
    mutationFn: () => superAdminApi.createPlan(form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['plans'] }); setShowForm(false); },
  });

  if (isLoading) return <div className="py-20 text-center">Loading plans…</div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Plan Management" description="Create unlimited SaaS pricing tiers with module toggles.">
        <Button onClick={() => setShowForm((v) => !v)}><Plus className="h-4 w-4" />Create Plan</Button>
      </PageHeader>

      {showForm && (
        <Card className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Plan Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="pro-plus" /></div>
            <div><Label>Monthly Price</Label><Input type="number" value={form.monthlyPrice} onChange={(e) => setForm({ ...form, monthlyPrice: Number(e.target.value) })} /></div>
            <div><Label>Yearly Price</Label><Input type="number" value={form.yearlyPrice} onChange={(e) => setForm({ ...form, yearlyPrice: Number(e.target.value) })} /></div>
            <div><Label>Max Users</Label><Input type="number" value={form.userLimit} onChange={(e) => setForm({ ...form, userLimit: Number(e.target.value) })} /></div>
            <div><Label>Max Storage (GB)</Label><Input type="number" value={form.storageLimitGb} onChange={(e) => setForm({ ...form, storageLimitGb: Number(e.target.value) })} /></div>
            <div><Label>Trial Days</Label><Input type="number" value={form.trialDays} onChange={(e) => setForm({ ...form, trialDays: Number(e.target.value) })} /></div>
            <div><Label>Max Leads</Label><Input type="number" value={form.leadLimit} onChange={(e) => setForm({ ...form, leadLimit: Number(e.target.value) })} /></div>
          </div>
          <div>
            <Label>Modules</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {MODULES.map((m) => (
                <label key={m} className="flex items-center gap-1 rounded-lg border px-2 py-1 text-xs capitalize">
                  <input type="checkbox" checked={form.features.includes(m)} onChange={(e) => setForm({ ...form, features: e.target.checked ? [...form.features, m] : form.features.filter((f) => f !== m) })} />
                  {m}
                </label>
              ))}
            </div>
          </div>
          <Button onClick={() => createMutation.mutate()} disabled={!form.name || !form.slug}>Save Plan</Button>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {(data || []).map((plan, i) => (
          <motion.div key={plan.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  <Badge className={plan.status === 'active' ? 'bg-emerald-500/15 text-emerald-700' : 'bg-slate-500/15 text-slate-600'}>{plan.status}</Badge>
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <div className="mb-4">
                <p className="text-3xl font-bold">{formatCurrency(plan.monthlyPrice)}</p>
                <p className="text-sm text-[var(--text-muted)]">per month · {formatCurrency(plan.yearlyPrice)}/year</p>
              </div>
              <ul className="mb-6 space-y-2 text-sm text-[var(--text-secondary)]">
                <li>{plan.userLimit} users · {plan.storageLimitGb} GB</li>
                <li>{plan.leadLimit?.toLocaleString()} leads</li>
                <li>{plan.trialDays ?? 14} day trial</li>
              </ul>
              <div className="mb-4 flex flex-wrap gap-1">
                {(plan.features || []).map((f) => <Badge key={f} className="bg-brand-500/10 text-brand-700 capitalize">{f}</Badge>)}
              </div>
              <Button variant="secondary" className="w-full" onClick={() => toggleMutation.mutate({ id: plan.id, status: plan.status === 'active' ? 'inactive' : 'active' })}>
                {plan.status === 'active' ? 'Deactivate' : 'Activate'}
              </Button>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
