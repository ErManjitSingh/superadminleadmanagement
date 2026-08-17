import { useEffect, useState } from 'react';
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
import DnsRecordsTable from './DnsRecordsTable';
import { formatDate } from '../../lib/utils';

function mutationErrorMessage(err) {
  return err?.response?.data?.message || err?.message || 'Something went wrong';
}

export default function DomainManagementPanel({ company, onUpdated }) {
  const companyId = company?.id || company?._id;
  const [customDomain, setCustomDomain] = useState(company?.customDomain || company?.primaryDomain || '');
  const [workspaceSubdomain, setWorkspaceSubdomain] = useState(company?.subdomain || '');
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    setCustomDomain(company?.customDomain || company?.primaryDomain || '');
    setWorkspaceSubdomain(company?.subdomain || '');
  }, [company?.id, company?.customDomain, company?.primaryDomain, company?.subdomain]);

  const showFeedback = (type, text) => {
    setFeedback({ type, text });
    window.setTimeout(() => setFeedback(null), 5000);
  };

  const connectMutation = useMutation({
    mutationFn: (domain) => superAdminApi.connectDomain(companyId, { customDomain: domain }),
    onSuccess: (res) => {
      const assigned = res?.data?.assignedPlatformSubdomain;
      const system = res?.data?.systemDomain || res?.data?.company?.systemDomain;
      showFeedback(
        'success',
        assigned
          ? `Workspace URL is now ${system}. No extra DNS is required.`
          : 'Custom domain connected. Share the DNS records below with the customer.',
      );
      onUpdated?.();
    },
    onError: (err) => showFeedback('error', mutationErrorMessage(err)),
  });

  const workspaceMutation = useMutation({
    mutationFn: (subdomain) => superAdminApi.updateCompany(companyId, { subdomain }),
    onSuccess: () => {
      showFeedback('success', `Workspace URL is now ${workspaceSubdomain.trim()}.${PLATFORM_DOMAIN}`);
      onUpdated?.();
    },
    onError: (err) => showFeedback('error', mutationErrorMessage(err)),
  });

  const verifyMutation = useMutation({
    mutationFn: () => superAdminApi.verifyDomain(companyId),
    onSuccess: (res) => {
      const verified = res?.data?.verified;
      showFeedback(
        verified ? 'success' : 'error',
        verified
          ? 'DNS verified successfully. SSL provisioning has started.'
          : 'DNS not detected yet. Confirm the CNAME/A record and try again.',
      );
      onUpdated?.();
    },
    onError: (err) => showFeedback('error', mutationErrorMessage(err)),
  });

  const refreshMutation = useMutation({
    mutationFn: () => superAdminApi.refreshDomain(companyId),
    onSuccess: (res) => {
      const verified = res?.data?.verified;
      showFeedback(
        verified ? 'success' : 'error',
        verified ? 'Domain status refreshed — still verified.' : 'Domain is no longer pointing to the platform.',
      );
      onUpdated?.();
    },
    onError: (err) => showFeedback('error', mutationErrorMessage(err)),
  });

  const disconnectMutation = useMutation({
    mutationFn: () => superAdminApi.disconnectDomain(companyId),
    onSuccess: () => {
      setCustomDomain('');
      showFeedback('success', 'Custom domain disconnected. Company will use the system subdomain.');
      onUpdated?.();
    },
    onError: (err) => showFeedback('error', mutationErrorMessage(err)),
  });

  const systemDomain = company?.systemDomain || `${company?.subdomain}.${PLATFORM_DOMAIN}`;
  const hasCustom = Boolean(company?.customDomain || company?.primaryDomain);
  const domainStatus = company?.domainStatus || (company?.domainVerified ? 'verified' : hasCustom ? 'pending' : 'not_connected');
  const busy = connectMutation.isPending || verifyMutation.isPending || refreshMutation.isPending || disconnectMutation.isPending || workspaceMutation.isPending;

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
            <p className="mt-2 text-xs text-emerald-800/80 dark:text-emerald-200/70">
              Platform URLs like <span className="font-mono">crm.{PLATFORM_DOMAIN}</span> are set here — not as a custom domain.
            </p>
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
          <label className="mb-2 block text-sm font-medium">Workspace URL (platform subdomain)</label>
          <p className="mb-2 text-xs text-[var(--text-muted)]">
            To use <span className="font-mono">crm.{PLATFORM_DOMAIN}</span>, set the subdomain to <span className="font-mono">crm</span>.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              className="min-w-[160px] max-w-[220px] font-mono text-sm"
              placeholder="crm"
              value={workspaceSubdomain}
              onChange={(e) => setWorkspaceSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            />
            <span className="font-mono text-sm text-[var(--text-muted)]">.{PLATFORM_DOMAIN}</span>
            <Button
              disabled={!companyId || !workspaceSubdomain.trim() || workspaceSubdomain.trim() === company?.subdomain || busy}
              onClick={() => workspaceMutation.mutate(workspaceSubdomain.trim())}
            >
              {workspaceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save workspace URL
            </Button>
          </div>
        </div>

        <div className="border-t border-[var(--border)] bg-slate-50/50 px-6 py-5 dark:bg-slate-900/30">
          <label className="mb-2 block text-sm font-medium">Connect custom domain</label>
          <p className="mb-2 text-xs text-[var(--text-muted)]">
            Use the customer&apos;s own domain (e.g. crm.company.com). A platform URL like crm.{PLATFORM_DOMAIN} is also accepted and will update the workspace subdomain.
          </p>
          <div className="flex flex-wrap gap-2">
            <Input
              className="min-w-[240px] flex-1 font-mono text-sm"
              placeholder="crm.company.com"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
            />
            <Button
              disabled={!companyId || !customDomain.trim() || busy}
              onClick={() => connectMutation.mutate(customDomain.trim())}
            >
              {connectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Connect Domain
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={!companyId || !hasCustom || busy}
              onClick={() => verifyMutation.mutate()}
            >
              {verifyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
              Verify DNS
            </Button>
            <Button
              variant="outline"
              disabled={!companyId || !hasCustom || busy}
              onClick={() => refreshMutation.mutate()}
            >
              {refreshMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh Status
            </Button>
            <Button
              variant="outline"
              className="text-rose-600 hover:text-rose-700"
              disabled={!companyId || !hasCustom || busy}
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

          {feedback && (
            <p className={`mt-3 flex items-center gap-2 text-sm ${feedback.type === 'success' ? 'text-emerald-700' : 'text-rose-600'}`}>
              {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              {feedback.text}
            </p>
          )}

          {domainStatus === 'failed' && !feedback && (
            <p className="mt-3 flex items-center gap-2 text-sm text-rose-600">
              <XCircle className="h-4 w-4" />
              DNS verification failed. Ensure CNAME points to the platform proxy target.
            </p>
          )}
        </div>
      </Card>

      {hasCustom && domainStatus !== 'verified' && (
        <Card className="overflow-hidden border-amber-200/60">
          <div className="border-b border-amber-200/60 bg-amber-50/50 px-6 py-4">
            <p className="text-sm font-semibold text-amber-900">DNS records customer must add</p>
            <p className="mt-1 text-xs text-amber-800/80">
              Share these with {company?.ownerName || 'the company owner'} until domain shows Verified.
            </p>
          </div>
          <div className="p-6">
            <DnsRecordsTable
              domain={company.customDomain || company.primaryDomain}
              records={company.records || []}
            />
          </div>
        </Card>
      )}
    </div>
  );
}
