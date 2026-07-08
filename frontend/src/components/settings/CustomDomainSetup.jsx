import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Cloud,
  Copy,
  Globe,
  Loader2,
  Server,
  ShieldCheck,
  Trash2,
  XCircle,
} from 'lucide-react';
import { toast } from '../../context/ToastContext';
import API from '../../api/axios';
import { APP_PLATFORM_DOMAIN } from '../../config/branding';
import { cn } from '../../lib/utils';

const PROVIDERS = ['GoDaddy', 'Cloudflare', 'Namecheap', 'Hostinger'];

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

function StatusPill({ status, map }) {
  const cfg = map[status] || map.pending;
  const Icon = cfg.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold', cfg.className)}>
      <Icon className="h-3.5 w-3.5" />
      {cfg.label}
    </span>
  );
}

const DNS_STATUS = {
  verified: { label: 'Verified', icon: CheckCircle2, className: 'bg-emerald-500/10 text-emerald-700' },
  pending: { label: 'Pending', icon: Clock, className: 'bg-amber-500/10 text-amber-700' },
  failed: { label: 'Failed', icon: XCircle, className: 'bg-rose-500/10 text-rose-700' },
  not_connected: { label: 'Not Connected', icon: Globe, className: 'bg-slate-500/10 text-slate-600' },
};

const SSL_STATUS = {
  active: { label: 'Active', icon: CheckCircle2, className: 'bg-emerald-500/10 text-emerald-700' },
  generating: { label: 'Generating', icon: Loader2, className: 'bg-sky-500/10 text-sky-700' },
  pending: { label: 'Pending', icon: Clock, className: 'bg-amber-500/10 text-amber-700' },
  failed: { label: 'Failed', icon: XCircle, className: 'bg-rose-500/10 text-rose-700' },
  expired: { label: 'Expired', icon: XCircle, className: 'bg-orange-500/10 text-orange-700' },
  not_applicable: { label: 'Platform SSL', icon: ShieldCheck, className: 'bg-slate-500/10 text-slate-600' },
};

export default function CustomDomainSetup({ company, onCompanyChange }) {
  const [dnsInfo, setDnsInfo] = useState(null);
  const [customDomain, setCustomDomain] = useState('');
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const loadDns = useCallback(async () => {
    const res = await API.get('/public/domain/dns-info', { skipSuccessToast: true });
    setDnsInfo(res.data?.data);
  }, []);

  useEffect(() => {
    loadDns().catch(() => {});
  }, [loadDns]);

  useEffect(() => {
    setCustomDomain(company?.customDomain || company?.primaryDomain || '');
  }, [company]);

  const cnameTarget = dnsInfo?.cnameTarget || `proxy.${APP_PLATFORM_DOMAIN}`;
  const dnsHost = useMemo(() => {
    if (!customDomain) return 'crm';
    const parts = customDomain.split('.');
    return parts.length > 2 ? parts[0] : 'crm';
  }, [customDomain]);

  const domainStatus = company?.domainStatus || (company?.domainVerified ? 'verified' : customDomain ? 'pending' : 'not_connected');
  const systemDomain = company?.systemDomain || `${company?.subdomain}.${APP_PLATFORM_DOMAIN}`;

  async function saveDomain() {
    setSaving(true);
    try {
      const res = await API.patch('/company-settings/domain', { customDomain, verify: false });
      onCompanyChange?.(res.data.company);
      toast.success('Custom domain saved — complete DNS setup below');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save domain');
    } finally {
      setSaving(false);
    }
  }

  async function verifyDomain() {
    setVerifying(true);
    try {
      const res = await API.post('/domain/verify', {}, { skipSuccessToast: true });
      onCompanyChange?.(res.data.company);
      toast.success(res.data.verified ? 'Domain verified successfully' : 'DNS not detected yet — check your records');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  }

  async function removeDomain() {
    if (!window.confirm('Remove custom domain and use your system subdomain only?')) return;
    const res = await API.delete('/company-settings/domain');
    onCompanyChange?.(res.data.company);
    setCustomDomain('');
    toast.success('Custom domain removed');
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 to-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">System domain</p>
          <p className="mt-2 font-mono text-sm font-semibold text-slate-900">{systemDomain}</p>
          <p className="mt-3 text-xs text-emerald-700">Always active — no DNS setup required</p>
        </div>
        <div className="rounded-2xl border border-subtle bg-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-content-muted">Custom domain</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusPill status={domainStatus} map={DNS_STATUS} />
            <StatusPill status={company?.sslStatus || 'not_applicable'} map={SSL_STATUS} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-subtle bg-surface p-5">
        <label className="mb-2 block text-sm font-medium text-content-primary">Request custom domain</label>
        <p className="mb-3 text-xs text-content-muted">Examples: crm.yourcompany.com, app.yourcompany.com, travel.yourcompany.com</p>
        <div className="flex flex-wrap gap-2">
          <input
            className="h-11 min-w-[240px] flex-1 rounded-xl border border-slate-200 px-3 font-mono text-sm"
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
            placeholder="crm.yourcompany.com"
          />
          <button
            type="button"
            onClick={saveDomain}
            disabled={saving || !customDomain.trim()}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save domain'}
          </button>
        </div>
      </div>

      {customDomain && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-50/80 to-indigo-50/40 p-6">
            <h4 className="flex items-center gap-2 font-semibold text-violet-900">
              <Cloud className="h-5 w-5" />
              DNS setup guide
            </h4>
            <p className="mt-1 text-sm text-violet-800/80">Follow these steps at your domain provider to connect your CRM.</p>

            <div className="mt-6 space-y-4">
              <StepCard step={1} title="Login to your domain provider">
                <div className="flex flex-wrap gap-2">
                  {PROVIDERS.map((p) => (
                    <span key={p} className="rounded-lg border border-white/80 bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-700">{p}</span>
                  ))}
                  <span className="rounded-lg border border-dashed border-violet-300 px-3 py-1.5 text-xs text-violet-700">etc.</span>
                </div>
              </StepCard>

              <StepCard step={2} title="Create DNS record">
                <div className="overflow-hidden rounded-xl border border-violet-200/60 bg-white">
                  <table className="w-full text-sm">
                    <tbody>
                      {[
                        ['Type', 'CNAME'],
                        ['Host', dnsHost],
                        ['Destination', cnameTarget],
                        ['TTL', 'Auto'],
                      ].map(([label, value]) => (
                        <tr key={label} className="border-t border-violet-100 first:border-t-0">
                          <td className="w-32 bg-violet-50/50 px-4 py-2.5 font-medium text-violet-900">{label}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center justify-between gap-2 font-mono text-xs sm:text-sm">
                              <span>{value}</span>
                              {label !== 'Type' && label !== 'TTL' && <CopyButton value={value} />}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {dnsInfo?.serverIp && (
                  <p className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                    <Server className="h-3.5 w-3.5" />
                    Alternative A record: {dnsHost} → {dnsInfo.serverIp}
                  </p>
                )}
              </StepCard>

              <StepCard step={3} title="Save changes">
                <p className="text-sm text-slate-600">DNS propagation can take a few minutes up to 48 hours depending on your provider.</p>
              </StepCard>

              <StepCard step={4} title="Verify your domain">
                <button
                  type="button"
                  onClick={verifyDomain}
                  disabled={verifying}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-4 text-base font-bold text-white shadow-lg shadow-violet-500/25 transition hover:from-violet-700 hover:to-indigo-700 disabled:opacity-60 sm:max-w-md"
                >
                  {verifying ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                  {verifying ? 'Verifying DNS…' : 'Verify domain'}
                </button>
              </StepCard>
            </div>
          </div>

          {company?.primaryDomain && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={removeDomain}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
              >
                <Trash2 className="h-4 w-4" />
                Disconnect custom domain
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StepCard({ step, title, children }) {
  return (
    <div className="rounded-xl border border-white/60 bg-white/60 p-4 backdrop-blur-sm">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
          {step}
        </span>
        <h5 className="font-semibold text-slate-900">{title}</h5>
      </div>
      {children}
    </div>
  );
}
