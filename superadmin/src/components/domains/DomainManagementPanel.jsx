import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  CheckCircle2, Globe, Loader2, RefreshCw, Shield, Unlink, XCircle,
} from 'lucide-react';
import { superAdminApi } from '../../api/superadmin';
import { PLATFORM_DOMAIN } from '../../lib/branding';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { DnsStatusBadge, DomainConnectedBadge, SslStatusBadge } from './DomainStatusBadge';
import { formatDate } from '../../lib/utils';

export default function DomainManagementPanel({ company, onUpdated }) {
  const [customDomain, setCustomDomain] = useState(company?.customDomain || company?.primaryDomain || '');

  const connectMutation = useMutation({
    mutationFn: (domain) => superAdminApi.connectDomain(company.id, { customDomain: domain }),
    onSuccess: () => onUpdated?.(),
  });

  const verifyMutation = useMutation({
    mutationFn: () => superAdminApi.verifyDomain(company.id),
    onSuccess: () => onUpdated?.(),
  });

  const refreshMutation = useMutation({
    mutationFn: () => superAdminApi.refreshDomain(company.id),
    onSuccess: () => onUpdated?.(),
  });

  const disconnectMutation = useMutation({
    mutationFn: () => superAdminApi.disconnectDomain(company.id),
    onSuccess: () => {
      setCustomDomain('');
      onUpdated?.();
    },
  });

  const systemDomain = company?.systemDomain || `${company?.subdomain}.${PLATFORM_DOMAIN}`;
  const hasCustom = Boolean(company?.customDomain || company?.primaryDomain);
  const domainStatus = company?.domainStatus || (company?.domainVerified ? 'verified' : hasCustom ? 'pending' : 'not_connected');
  const busy = connectMutation.isPending || verifyMutation.isPending || refreshMutation.isPending || disconnectMutation.isPending;

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-[var(--border)]">
        <div className="border-b border-[var(--border)] bg-gradient-to-r from-slate-50 to-violet-50/50 px-6 py-4 dark:from-slate-900/50 dark:to-violet-950/20">
          <CardHeader className="p-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="h-5 w-5 text-violet-600" />
              Domain Management
            </CardTitle>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Manage system subdomain and custom company domains for this tenant.
            </p>
          </CardHeader>
        </div>

        <div className="grid gap-4 p-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/40 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Current System Domain</p>
            <p className="mt-2 font-mono text-lg font-semibold text-slate-900 dark:text-white">{systemDomain}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-[var(--text-muted)]">Status</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Active
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-white p-5 dark:bg-slate-900/40">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Custom Domain</p>
            <p className="mt-2 font-mono text-lg font-semibold">
              {hasCustom ? (company.customDomain || company.primaryDomain) : '—'}
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-muted)]">DNS</span>
                <DnsStatusBadge status={domainStatus} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-muted)]">SSL</span>
                <SslStatusBadge status={company?.sslStatus} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-muted)]">Connection</span>
                <DomainConnectedBadge connected={domainStatus === 'verified'} />
              </div>
            </div>
            {(company?.dnsVerifiedAt || company?.domainConnectedAt) && (
              <div className="mt-4 space-y-1 border-t border-[var(--border)] pt-3 text-xs text-[var(--text-muted)]">
                {company.dnsVerifiedAt && <p>DNS verified: {formatDate(company.dnsVerifiedAt)}</p>}
                {company.domainConnectedAt && <p>Connected: {formatDate(company.domainConnectedAt)}</p>}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-[var(--border)] bg-slate-50/50 px-6 py-5 dark:bg-slate-900/30">
          <label className="mb-2 block text-sm font-medium">Connect custom domain</label>
          <div className="flex flex-wrap gap-2">
            <Input
              className="min-w-[240px] flex-1 font-mono text-sm"
              placeholder="crm.company.com"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
            />
            <Button
              disabled={!customDomain.trim() || busy}
              onClick={() => connectMutation.mutate(customDomain.trim())}
            >
              {connectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Connect Domain
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={!hasCustom || busy}
              onClick={() => verifyMutation.mutate()}
            >
              {verifyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
              Verify DNS
            </Button>
            <Button
              variant="outline"
              disabled={!hasCustom || busy}
              onClick={() => refreshMutation.mutate()}
            >
              {refreshMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh Status
            </Button>
            <Button
              variant="outline"
              className="text-rose-600 hover:text-rose-700"
              disabled={!hasCustom || busy}
              onClick={() => {
                if (window.confirm('Disconnect custom domain? The company will use the system subdomain only.')) {
                  disconnectMutation.mutate();
                }
              }}
            >
              {disconnectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlink className="h-4 w-4" />}
              Disconnect
            </Button>
          </div>

          {domainStatus === 'failed' && (
            <p className="mt-3 flex items-center gap-2 text-sm text-rose-600">
              <XCircle className="h-4 w-4" />
              DNS verification failed. Ensure CNAME points to the platform proxy target.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
