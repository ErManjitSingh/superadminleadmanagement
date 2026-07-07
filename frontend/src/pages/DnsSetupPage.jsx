import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Copy,
  Globe,
  Loader2,
  ShieldCheck,
  SkipForward,
} from 'lucide-react';
import API from '../api/axios';
import { APP_PLATFORM_DOMAIN } from '../config/branding';
import { toast } from '../context/ToastContext';
import { cn } from '../lib/utils';

function CopyBtn({ value }) {
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(value);
        toast.success('Copied');
      }}
      className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-violet-50 hover:text-violet-600"
      aria-label="Copy"
    >
      <Copy className="h-3.5 w-3.5" />
    </button>
  );
}

export default function DnsSetupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [company, setCompany] = useState(null);
  const [dnsSetup, setDnsSetup] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get('/company-settings', { skipSuccessToast: true });
      const c = res.data?.company || res.data;
      setCompany(c);
      if (c?.domainVerified || c?.domainType !== 'custom' || !c?.primaryDomain) {
        navigate('/admin/dashboard', { replace: true });
        return;
      }
      const dnsRes = await API.get('/public/domain/dns-info', { skipSuccessToast: true });
      const info = dnsRes.data?.data;
      const host = c.primaryDomain?.split('.').length > 2 ? c.primaryDomain.split('.')[0] : 'crm';
      setDnsSetup({
        domain: c.primaryDomain,
        dnsHost: host,
        cnameTarget: info?.cnameTarget || `proxy.${APP_PLATFORM_DOMAIN}`,
        serverIp: info?.serverIp,
        records: info?.records || [
          { type: 'CNAME', host, hostLabel: host, pointsTo: info?.cnameTarget, recommended: true },
        ],
        instructions: info?.setupSteps || [],
      });
    } catch {
      navigate('/admin/dashboard', { replace: true });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  async function verifyDns() {
    setVerifying(true);
    try {
      const res = await API.post('/domain/verify', null, { skipSuccessToast: true });
      const verified = res.data?.verified;
      if (verified) {
        toast.success('DNS verified! Your custom domain is now active.');
        navigate('/admin/dashboard', { replace: true });
      } else {
        toast.info('DNS not detected yet. Please check your records and try again in a few minutes.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  const records = dnsSetup?.records || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-indigo-50/40 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30">
            <Globe className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Connect your custom domain</h1>
          <p className="mt-2 text-sm text-slate-600">
            Add these DNS records at your domain provider to activate{' '}
            <span className="font-mono font-semibold text-violet-700">{dnsSetup?.domain}</span>
          </p>
        </div>

        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <div className="flex items-start gap-2">
            <Clock className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Your workspace is ready on{' '}
              <span className="font-mono font-medium">{company?.systemDomain || `${company?.subdomain}.${APP_PLATFORM_DOMAIN}`}</span>.
              Complete DNS setup to use your own domain.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">DNS Records to Add</h2>
          <div className="space-y-3">
            {records.map((rec) => (
              <div key={`${rec.type}-${rec.host}`} className="overflow-hidden rounded-xl border border-slate-200">
                <div className={cn(
                  'flex items-center justify-between px-4 py-2 text-xs font-semibold',
                  rec.recommended ? 'bg-violet-50 text-violet-800' : 'bg-slate-50 text-slate-600',
                )}>
                  <span>{rec.type} Record {rec.recommended ? '(Recommended)' : '(Alternative)'}</span>
                </div>
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      ['Type', rec.type],
                      ['Host / Name', rec.hostLabel || rec.host],
                      ['Points to / Value', rec.pointsTo],
                      ['TTL', rec.ttl || 'Auto'],
                    ].map(([label, value]) => (
                      <tr key={label} className="border-t border-slate-100">
                        <td className="w-36 bg-slate-50/50 px-4 py-2.5 font-medium text-slate-600">{label}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-between gap-2 font-mono text-xs sm:text-sm">
                            <span className="break-all">{value}</span>
                            {label !== 'Type' && label !== 'TTL' && <CopyBtn value={value} />}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

          {(dnsSetup?.instructions || []).length > 0 && (
            <ol className="mt-5 list-decimal space-y-1.5 pl-5 text-sm text-slate-600">
              {dnsSetup.instructions.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={verifyDns}
              disabled={verifying}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 disabled:opacity-60"
            >
              {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {verifying ? 'Verifying…' : 'Verify DNS'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/dashboard')}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <SkipForward className="h-4 w-4" />
              Skip for now
            </button>
          </div>

          <p className="mt-4 text-center text-xs text-slate-500">
            You can complete this later from{' '}
            <Link to="/admin/settings" className="font-medium text-violet-600 hover:underline">Settings → Domain</Link>
          </p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          <span>Workspace created — continue to CRM after DNS setup</span>
          <button type="button" onClick={() => navigate('/admin/dashboard')} className="inline-flex items-center gap-1 font-semibold text-violet-600 hover:underline">
            Go to dashboard <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
