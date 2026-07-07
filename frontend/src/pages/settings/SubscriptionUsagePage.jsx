import { useCallback, useEffect, useState } from 'react';
import { BarChart3, HardDrive, Loader2, Mail, Users, Building2, FileText, Calendar, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from '../../context/ToastContext';
import API from '../../api/axios';
import PageHeader from '../../components/ui/PageHeader';
import { cn } from '../../lib/utils';

function UsageBar({ label, used, limit, icon: Icon }) {
  const unlimited = limit == null || limit <= 0;
  const pct = unlimited ? Math.min(100, (used / Math.max(used, 1)) * 10) : Math.min(100, Math.round((used / limit) * 100));
  const remaining = unlimited ? null : Math.max(0, limit - used);
  const tone = pct >= 90 ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-500' : 'bg-violet-600';

  return (
    <div className="rounded-xl border border-subtle bg-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600">
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <p className="font-medium text-content-primary">{label}</p>
            <p className="text-xs text-content-muted">
              {used.toLocaleString('en-IN')}
              {unlimited ? ' used' : ` / ${limit.toLocaleString('en-IN')}`}
            </p>
          </div>
        </div>
        {!unlimited && (
          <span className={cn('text-sm font-semibold', remaining === 0 ? 'text-rose-600' : 'text-content-muted')}>
            {remaining} left
          </span>
        )}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={cn('h-full rounded-full transition-all', tone)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatPrice(amount) {
  if (!amount) return 'Contact us';
  return `₹${Number(amount).toLocaleString('en-IN')}/mo`;
}

const SMTP_FIELDS = [
  ['smtpHost', 'SMTP Host', 'smtp.gmail.com'],
  ['smtpPort', 'SMTP Port', '465'],
  ['smtpUser', 'SMTP Username', 'you@company.com'],
  ['smtpPass', 'SMTP Password', '••••••••'],
  ['smtpFromName', 'From Name', 'Your Travel Company'],
];

export default function SubscriptionUsagePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [upgradeMessage, setUpgradeMessage] = useState('');
  const [data, setData] = useState(null);
  const [smtp, setSmtp] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [subRes, settingsRes] = await Promise.all([
        API.get('/company-settings/subscription', { skipSuccessToast: true }),
        API.get('/company-settings', { skipSuccessToast: true }),
      ]);
      setData(subRes.data?.data || null);
      setSmtp(settingsRes.data?.settings || {});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load subscription data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveSmtp(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await API.patch('/company-settings', { tenantSettings: smtp });
      toast.success('SMTP settings saved');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function submitUpgrade(e) {
    e.preventDefault();
    if (!selectedPlan) {
      toast.error('Please select a plan');
      return;
    }
    setSubmitting(true);
    try {
      const res = await API.post('/company-settings/upgrade-request', {
        targetPlanSlug: selectedPlan,
        message: upgradeMessage.trim() || undefined,
      });
      toast.success(res.data?.data?.message || 'Upgrade request submitted');
      setShowUpgrade(false);
      setUpgradeMessage('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit upgrade request');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  const limits = data?.limits || {};
  const usage = data?.usage || {};
  const plans = (data?.availablePlans || []).filter((p) => p.slug !== data?.planSlug);
  const trialWarning = data?.showTrialWarning || data?.isExpired;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plan & Usage"
        description="Subscription limits, usage and email (SMTP) configuration for your company"
        breadcrumbs={['Settings', 'Plan & Usage']}
      />

      {trialWarning && (
        <div className={cn(
          'rounded-2xl border p-4',
          data?.isExpired ? 'border-rose-200 bg-rose-50' : 'border-amber-200 bg-amber-50',
        )}
        >
          <p className={cn('font-semibold', data?.isExpired ? 'text-rose-900' : 'text-amber-900')}>
            {data?.isExpired
              ? 'Your subscription has expired'
              : data?.daysRemaining <= 1
                ? 'Trial ending soon'
                : `Trial ends in ${data?.daysRemaining} days`}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {data?.trialEndDate && `Ends ${formatDate(data.trialEndDate)}. `}
            Upgrade to keep your CRM running without interruption.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-violet-200/60 bg-gradient-to-r from-violet-50 to-indigo-50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-violet-700">Current plan</p>
            <p className="text-2xl font-bold text-slate-900">{data?.planName || 'Plan'}</p>
            {data?.status && (
              <p className="mt-1 text-sm capitalize text-slate-600">Status: {data.status.replace('_', ' ')}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <p className="text-sm text-slate-600">
              Storage: {(limits.storageUsedMb / 1024).toFixed(1)} / {limits.storageLimitGb} GB
            </p>
            {data?.upgradeRequestPending ? (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-800">
                <CheckCircle2 className="h-4 w-4" />
                Upgrade request pending
              </span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSelectedPlan(plans[0]?.slug || '');
                  setShowUpgrade(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
              >
                <Sparkles className="h-4 w-4" />
                Request upgrade
              </button>
            )}
          </div>
        </div>
      </div>

      <section>
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-content-primary">
          <BarChart3 className="h-5 w-5 text-violet-600" />
          Usage & limits
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <UsageBar label="Users" used={usage.users || 0} limit={limits.userLimit} icon={Users} />
          <UsageBar label="Branches" used={usage.branches || 0} limit={limits.branchLimit} icon={Building2} />
          <UsageBar label="Leads" used={usage.leads || 0} limit={limits.leadLimit} icon={FileText} />
          <UsageBar label="Bookings" used={usage.bookings || 0} limit={limits.bookingLimit} icon={Calendar} />
          <UsageBar
            label="Storage"
            used={Math.round(limits.storageUsedMb || 0)}
            limit={(limits.storageLimitGb || 0) * 1024}
            icon={HardDrive}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-subtle bg-surface p-6">
        <h3 className="mb-1 flex items-center gap-2 font-semibold text-content-primary">
          <Mail className="h-5 w-5 text-sky-600" />
          Company SMTP (Email)
        </h3>
        <p className="mb-4 text-sm text-content-muted">
          Emails to leads and customers are sent from your company SMTP. If not configured, platform SMTP is used.
        </p>
        <form onSubmit={saveSmtp} className="grid gap-4 sm:grid-cols-2">
          {SMTP_FIELDS.map(([key, label, placeholder]) => (
            <div key={key}>
              <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
              <input
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-mono"
                type={key === 'smtpPass' ? 'password' : key === 'smtpPort' ? 'number' : 'text'}
                value={smtp[key] || ''}
                placeholder={placeholder}
                onChange={(e) => setSmtp((s) => ({ ...s, [key]: e.target.value }))}
              />
            </div>
          ))}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save SMTP Settings'}
            </button>
          </div>
        </form>
      </section>

      {showUpgrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Request plan upgrade</h3>
            <p className="mt-1 text-sm text-slate-600">
              Choose a plan and our team will contact you to complete the upgrade.
            </p>
            <form onSubmit={submitUpgrade} className="mt-5 space-y-4">
              <div className="space-y-2">
                {plans.length === 0 ? (
                  <p className="text-sm text-slate-600">Contact support for a custom plan.</p>
                ) : (
                  plans.map((plan) => (
                    <label
                      key={plan.slug}
                      className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors',
                        selectedPlan === plan.slug ? 'border-violet-500 bg-violet-50' : 'border-slate-200 hover:border-violet-300',
                      )}
                    >
                      <input
                        type="radio"
                        name="plan"
                        value={plan.slug}
                        checked={selectedPlan === plan.slug}
                        onChange={() => setSelectedPlan(plan.slug)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{plan.name}</p>
                        <p className="text-sm text-violet-700">{formatPrice(plan.monthlyPrice)}</p>
                        {plan.description && <p className="mt-1 text-xs text-slate-500">{plan.description}</p>}
                      </div>
                    </label>
                  ))
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Message (optional)</label>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Tell us about your team size or requirements…"
                  value={upgradeMessage}
                  onChange={(e) => setUpgradeMessage(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUpgrade(false)}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || plans.length === 0}
                  className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {submitting ? 'Submitting…' : 'Submit request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
