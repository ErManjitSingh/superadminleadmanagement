import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pause, Play } from 'lucide-react';
import { superAdminApi } from '../../api/superadmin';
import { Card, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { formatDate, formatCurrency, STATUS_COLORS } from '../../lib/utils';

export default function SubscriptionManager({ company, onUpdated }) {
  const queryClient = useQueryClient();
  const currentPlan = company?.subscriptionPlan;
  const isPaused = company?.status === 'suspended';

  const [planId, setPlanId] = useState(currentPlan?._id || currentPlan?.id || '');
  const [billingCycle, setBillingCycle] = useState(company?.billingCycle || 'monthly');
  const [syncFeatures, setSyncFeatures] = useState(true);
  const [activate, setActivate] = useState(company?.status === 'expired');
  const [periods, setPeriods] = useState(1);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setPlanId(currentPlan?._id || currentPlan?.id || '');
    setBillingCycle(company?.billingCycle || 'monthly');
  }, [company?.id]);

  const { data: plansData } = useQuery({
    queryKey: ['plans'],
    queryFn: () => superAdminApi.listPlans().then((r) => r.data),
  });
  const plans = plansData?.data || plansData?.plans || plansData || [];

  const afterChange = (msg) => {
    setMessage(msg);
    queryClient.invalidateQueries({ queryKey: ['company', company.id] });
    onUpdated?.();
    setTimeout(() => setMessage(''), 4000);
  };

  const changePlanMutation = useMutation({
    mutationFn: () =>
      superAdminApi.upgradePlan(company.id, { planId, billingCycle, syncFeatures, activate }),
    onSuccess: () => afterChange('Plan updated successfully.'),
  });

  const renewMutation = useMutation({
    mutationFn: () => superAdminApi.renewSubscription(company.id, { periods: Number(periods), billingCycle }),
    onSuccess: () => afterChange(`Subscription renewed for ${periods} ${billingCycle === 'yearly' ? 'year(s)' : 'month(s)'}.`),
  });

  const pauseMutation = useMutation({
    mutationFn: (action) => superAdminApi.bulkCompanies({ ids: [company.id], action }),
    onSuccess: (_data, action) =>
      afterChange(action === 'suspend' ? 'Company paused. Users cannot access this workspace.' : 'Company resumed successfully.'),
  });

  const selectedPlan = plans.find((p) => (p._id || p.id) === planId);
  const price = selectedPlan
    ? billingCycle === 'yearly'
      ? selectedPlan.yearlyPrice
      : selectedPlan.monthlyPrice
    : 0;

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <CardTitle className="mb-4">Current Subscription</CardTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Info label="Plan" value={currentPlan?.name || '—'} />
          <Info label="Status" value={<Badge className={STATUS_COLORS[company.status]}>{company.status}</Badge>} />
          <Info label="Billing" value={company.billingCycle || 'monthly'} />
          <Info label="Monthly" value={formatCurrency(currentPlan?.monthlyPrice)} />
          <Info label="Trial ends" value={formatDate(company.trialEndDate)} />
          <Info label="Renews on" value={formatDate(company.renewDate)} />
        </div>
      </Card>

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
          {message}
        </div>
      )}

      <Card className="p-5 space-y-3">
        <CardTitle>Pause / Resume Access</CardTitle>
        <p className="text-sm text-[var(--text-muted)]">
          {isPaused
            ? 'This company is paused. Users cannot log in or use the workspace until you resume it.'
            : 'Pause temporarily blocks all company users from accessing the workspace. Subscription dates are not changed.'}
        </p>
        {isPaused ? (
          <Button
            variant="outline"
            disabled={pauseMutation.isPending}
            onClick={() => pauseMutation.mutate('activate')}
          >
            <Play className="h-4 w-4" />
            {pauseMutation.isPending ? 'Resuming…' : 'Resume Company'}
          </Button>
        ) : (
          <Button
            variant="outline"
            disabled={pauseMutation.isPending}
            onClick={() => {
              if (confirm(`Pause "${company.name}"? Users will not be able to access this workspace until resumed.`)) {
                pauseMutation.mutate('suspend');
              }
            }}
          >
            <Pause className="h-4 w-4" />
            {pauseMutation.isPending ? 'Pausing…' : 'Pause Company'}
          </Button>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5 space-y-4">
          <CardTitle>Change / Upgrade Plan</CardTitle>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Plan</label>
            <select
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
            >
              <option value="">Select a plan…</option>
              {plans.map((p) => (
                <option key={p._id || p.id} value={p._id || p.id}>
                  {p.name} — ₹{p.monthlyPrice}/mo · ₹{p.yearlyPrice}/yr
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Billing cycle</label>
            <select
              value={billingCycle}
              onChange={(e) => setBillingCycle(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={syncFeatures} onChange={(e) => setSyncFeatures(e.target.checked)} />
            Sync features from plan
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={activate} onChange={(e) => setActivate(e.target.checked)} />
            Activate &amp; set renewal date now
          </label>
          {selectedPlan && (
            <p className="text-sm text-[var(--text-muted)]">
              Amount for this cycle: <strong className="text-[var(--text-primary)]">{formatCurrency(price)}</strong>
            </p>
          )}
          <Button
            onClick={() => changePlanMutation.mutate()}
            disabled={!planId || changePlanMutation.isPending}
          >
            {changePlanMutation.isPending ? 'Saving…' : 'Apply Plan'}
          </Button>
        </Card>

        <Card className="p-5 space-y-4">
          <CardTitle>Renew / Extend</CardTitle>
          <p className="text-sm text-[var(--text-muted)]">
            Extend the subscription from the current renewal date. Sets status to Active.
          </p>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Periods</label>
            <input
              type="number"
              min="1"
              max="36"
              value={periods}
              onChange={(e) => setPeriods(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Cycle</label>
            <select
              value={billingCycle}
              onChange={(e) => setBillingCycle(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <Button variant="outline" onClick={() => renewMutation.mutate()} disabled={renewMutation.isPending}>
            {renewMutation.isPending ? 'Renewing…' : 'Renew Subscription'}
          </Button>
        </Card>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
