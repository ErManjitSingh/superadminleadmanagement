import { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Copy,
  Globe,
  Loader2,
  Palette,
  ShieldCheck,
  Trash2,
  XCircle,
} from 'lucide-react';
import { toast } from '../../context/ToastContext';
import API from '../../api/axios';
import PageHeader from '../../components/ui/PageHeader';
import { APP_PLATFORM_DOMAIN } from '../../config/branding';
import { cn } from '../../lib/utils';
import OnboardingChecklist from '../../components/onboarding/OnboardingChecklist';

function CopyButton({ value }) {
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(value);
        toast.success('Copied');
      }}
      className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
      aria-label="Copy"
    >
      <Copy className="h-3.5 w-3.5" />
    </button>
  );
}

export default function CompanyWorkspacePage() {
  const [company, setCompany] = useState(null);
  const [dnsInfo, setDnsInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [customDomain, setCustomDomain] = useState('');
  const [whiteLabel, setWhiteLabel] = useState({});

  const load = useCallback(async () => {
    const [settingsRes, dnsRes] = await Promise.all([
      API.get('/company-settings', { skipSuccessToast: true }),
      API.get('/public/domain/dns-info', { skipSuccessToast: true }),
    ]);
    const c = settingsRes.data?.company;
    setCompany(c);
    setCustomDomain(c?.primaryDomain || '');
    setWhiteLabel(c?.whiteLabel || {});
    setDnsInfo(dnsRes.data?.data);
    setLoading(false);
  }, []);

  useEffect(() => { load().catch(() => setLoading(false)); }, [load]);

  async function saveBranding(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await API.patch('/company-settings', { whiteLabel, logo: company?.logo });
      setCompany(res.data.company);
      toast.success('Branding saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function verifyDomain() {
    setVerifying(true);
    try {
      const res = await API.post('/company-settings/domain/verify', null, { skipSuccessToast: true });
      setCompany((c) => ({ ...c, ...res.data, domainVerified: res.data.verified }));
      toast.success(res.data.verified ? 'Domain verified' : 'DNS still pending');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  }

  async function updateDomain() {
    setSaving(true);
    try {
      const res = await API.patch('/company-settings/domain', { primaryDomain: customDomain, verify: false });
      setCompany(res.data.company);
      toast.success('Domain updated — verify DNS when ready');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  async function removeDomain() {
    if (!window.confirm('Remove custom domain and use subdomain only?')) return;
    const res = await API.delete('/company-settings/domain');
    setCompany(res.data.company);
    setCustomDomain('');
    toast.success('Custom domain removed');
  }

  async function resendVerification() {
    await API.post('/company-settings/resend-verification');
    toast.success('Verification email sent');
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  const sslLabel = { active: 'Active', pending: 'Pending', failed: 'Failed', not_applicable: 'Platform SSL' };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workspace & Domain"
        description="Manage your company domain, SSL, and white-label branding"
        breadcrumbs={['Settings', 'Workspace']}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {!company?.ownerEmailVerified && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="font-semibold text-amber-900">Email verification pending</p>
              <p className="mt-1 text-sm text-amber-800">Verify your business email to unlock full workspace access.</p>
              <button type="button" onClick={resendVerification} className="mt-3 text-sm font-semibold text-amber-900 underline">
                Resend verification email
              </button>
            </div>
          )}

          <section className="rounded-2xl border border-subtle bg-surface p-6">
            <h3 className="flex items-center gap-2 font-semibold text-content-primary">
              <Globe className="h-5 w-5 text-violet-600" />
              Domain
            </h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-slate-500">Subdomain</span>
                <span className="font-mono font-medium">{company?.subdomain}.{APP_PLATFORM_DOMAIN}</span>
              </div>
              <div className="flex justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-slate-500">Primary domain</span>
                <span className="font-medium">{company?.primaryDomain || '—'}</span>
              </div>
              <div className="flex justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-slate-500">DNS status</span>
                <span className={cn('flex items-center gap-1 font-medium', company?.domainVerified ? 'text-emerald-600' : 'text-amber-600')}>
                  {company?.domainVerified ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                  {company?.domainVerified ? 'Verified' : 'Pending'}
                </span>
              </div>
              <div className="flex justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-slate-500">SSL</span>
                <span className="font-medium">{sslLabel[company?.sslStatus] || company?.sslStatus}</span>
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-1.5 block text-sm font-medium">Custom domain</label>
              <div className="flex gap-2">
                <input
                  className="h-11 flex-1 rounded-xl border border-slate-200 px-3 text-sm"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="crm.yourcompany.com"
                />
                <button type="button" onClick={updateDomain} disabled={saving} className="rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white">
                  Save
                </button>
              </div>
            </div>

            {customDomain && (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-3 text-sm font-semibold">DNS Instructions</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg bg-white border px-3 py-2 font-mono text-xs">
                    <span>CNAME crm → {dnsInfo?.cnameTarget || `app.${APP_PLATFORM_DOMAIN}`}</span>
                    <CopyButton value={dnsInfo?.cnameTarget || `app.${APP_PLATFORM_DOMAIN}`} />
                  </div>
                  {dnsInfo?.serverIp && (
                    <div className="flex items-center justify-between rounded-lg bg-white border px-3 py-2 font-mono text-xs">
                      <span>A crm → {dnsInfo.serverIp}</span>
                      <CopyButton value={dnsInfo.serverIp} />
                    </div>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={verifyDomain}
                    disabled={verifying}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white"
                  >
                    {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    Verify DNS
                  </button>
                  {company?.primaryDomain && (
                    <button type="button" onClick={removeDomain} className="rounded-xl border border-rose-200 px-4 text-rose-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-subtle bg-surface p-6">
            <h3 className="flex items-center gap-2 font-semibold text-content-primary">
              <Palette className="h-5 w-5 text-violet-600" />
              White Label
            </h3>
            <form onSubmit={saveBranding} className="mt-4 grid gap-4 sm:grid-cols-2">
              {[
                ['appTitle', 'App Title', 'text'],
                ['primaryColor', 'Primary Color', 'color'],
                ['secondaryColor', 'Secondary Color', 'color'],
                ['sidebarColor', 'Sidebar Color', 'color'],
                ['emailLogoUrl', 'Email Logo URL', 'text'],
                ['invoiceLogoUrl', 'Invoice Logo URL', 'text'],
                ['quotationLogoUrl', 'Quotation Logo URL', 'text'],
              ].map(([key, label, type]) => (
                <div key={key}>
                  <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
                  <input
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                    value={whiteLabel[key] || ''}
                    onChange={(e) => setWhiteLabel((w) => ({ ...w, [key]: e.target.value }))}
                    type={type}
                  />
                </div>
              ))}
              <div className="sm:col-span-2">
                <button type="submit" disabled={saving} className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white">
                  {saving ? 'Saving…' : 'Save Branding'}
                </button>
              </div>
            </form>
          </section>
        </div>

        <div>
          <OnboardingChecklist />
        </div>
      </div>
    </div>
  );
}
