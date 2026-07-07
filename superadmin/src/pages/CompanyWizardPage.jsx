import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { superAdminApi } from '../api/superadmin';
import { Button } from '../components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input, Label, Select, Textarea } from '../components/ui/input';

const STEPS = ['Company', 'Plan', 'Domain', 'Finish'];

const initialForm = {
  name: '',
  subdomain: '',
  primaryDomain: '',
  country: 'India',
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  ownerName: '',
  ownerEmail: '',
  ownerPassword: '',
  phone: '',
  subscriptionPlanId: '',
  billingCycle: 'monthly',
  status: 'trial',
  trialDays: 14,
};

export default function CompanyWizardPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);

  const { data: plansData } = useQuery({
    queryKey: ['plans'],
    queryFn: () => superAdminApi.listPlans().then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => superAdminApi.createCompany(payload),
    onSuccess: (res) => {
      setResult(res.data);
      setStep(4);
    },
  });

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function next() {
    if (step === 3) {
      createMutation.mutate({ ...form, ownerPassword: form.ownerPassword });
      return;
    }
    setStep((s) => Math.min(s + 1, 3));
  }

  const selectedPlan = plansData?.find((p) => p.id === form.subscriptionPlanId);
  const done = step === 4 && result;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add Company</h1>
        <p className="text-[var(--text-secondary)]">Provision a new tenant with automatic setup</p>
      </div>

      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${i <= step ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500 dark:bg-slate-800'}`}>
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className="hidden text-xs font-medium sm:inline">{label}</span>
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-[var(--border)]" />}
          </div>
        ))}
      </div>

      <Card>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
          >
            {step === 0 && (
              <div className="space-y-4">
                <CardHeader><CardTitle>Company & Owner</CardTitle></CardHeader>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2"><Label>Company Name *</Label><Input value={form.name} onChange={(e) => updateField('name', e.target.value)} /></div>
                  <div className="sm:col-span-2"><Label>Owner Name *</Label><Input value={form.ownerName} onChange={(e) => updateField('ownerName', e.target.value)} /></div>
                  <div><Label>Email *</Label><Input type="email" value={form.ownerEmail} onChange={(e) => updateField('ownerEmail', e.target.value)} /></div>
                  <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => updateField('phone', e.target.value)} /></div>
                  <div><Label>Password *</Label><Input type="password" value={form.ownerPassword} onChange={(e) => updateField('ownerPassword', e.target.value)} /></div>
                  <div><Label>Country</Label><Input value={form.country} onChange={(e) => updateField('country', e.target.value)} /></div>
                  <div><Label>Timezone</Label><Input value={form.timezone} onChange={(e) => updateField('timezone', e.target.value)} /></div>
                  <div><Label>Currency</Label><Input value={form.currency} onChange={(e) => updateField('currency', e.target.value)} /></div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <CardHeader><CardTitle>Select Plan</CardTitle></CardHeader>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(plansData || []).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => updateField('subscriptionPlanId', p.id)}
                      className={`rounded-xl border p-4 text-left transition ${form.subscriptionPlanId === p.id ? 'border-violet-500 bg-violet-500/10 ring-2 ring-violet-500/20' : 'border-[var(--border)] hover:border-violet-300'}`}
                    >
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-sm text-[var(--text-muted)]">{p.userLimit} users · {p.storageLimitGb} GB</p>
                    </button>
                  ))}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><Label>Billing Cycle</Label><Select value={form.billingCycle} onChange={(e) => updateField('billingCycle', e.target.value)}><option value="monthly">Monthly</option><option value="yearly">Yearly</option></Select></div>
                  <div><Label>Trial Days</Label><Input type="number" value={form.trialDays} onChange={(e) => updateField('trialDays', Number(e.target.value))} /></div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <CardHeader><CardTitle>Custom Domain</CardTitle><CardDescription>Optional — e.g. crm.company.com</CardDescription></CardHeader>
                <div><Label>Subdomain</Label><Input value={form.subdomain} onChange={(e) => updateField('subdomain', e.target.value)} placeholder="acme" /></div>
                <div><Label>Primary Domain</Label><Input value={form.primaryDomain} onChange={(e) => updateField('primaryDomain', e.target.value)} placeholder="crm.acme.com" /></div>
              </div>
            )}

            {step === 3 && !done && (
              <div className="space-y-4">
                <CardHeader><CardTitle>Review & Finish</CardTitle><CardDescription>Automatically creates company, admin user, Head Office branch, roles & settings.</CardDescription></CardHeader>
                <div className="space-y-2 rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-900/50">
                  <p><strong>Company:</strong> {form.name}</p>
                  <p><strong>Owner:</strong> {form.ownerName} ({form.ownerEmail})</p>
                  <p><strong>Plan:</strong> {selectedPlan?.name || '—'}</p>
                  <p><strong>Domain:</strong> {form.primaryDomain || `${form.subdomain || 'auto'}.…`}</p>
                </div>
              </div>
            )}

            {done && (
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                  <Check className="h-8 w-8" />
                </div>
                <CardHeader>
                  <CardTitle>Company Created</CardTitle>
                  <CardDescription>
                    {result.company?.name} is ready. Admin user and roles were provisioned automatically.
                  </CardDescription>
                </CardHeader>
                {result.provisioning?.tempPassword && (
                  <div className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm">
                    <p className="font-medium">Temporary admin password</p>
                    <p className="font-mono">{result.provisioning.tempPassword}</p>
                  </div>
                )}
                <Button onClick={() => navigate(`/admin/companies/${result.company?.id || result.company?._id}`)}>View Company</Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {!done && step <= 3 && (
          <div className="mt-8 flex justify-between border-t border-[var(--border)] pt-4">
            <Button variant="secondary" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            <Button
              onClick={next}
              disabled={
                createMutation.isPending
                || (step === 0 && (!form.name || !form.ownerName || !form.ownerEmail || !form.ownerPassword))
                || (step === 1 && !form.subscriptionPlanId)
              }
            >
              {step === 3 ? (createMutation.isPending ? 'Creating…' : 'Create Company') : 'Continue'}
              {step < 3 && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        )}
        {createMutation.isError && (
          <p className="mt-3 text-sm text-red-600">{createMutation.error?.response?.data?.message || 'Failed to create company'}</p>
        )}
      </Card>
    </div>
  );
}
