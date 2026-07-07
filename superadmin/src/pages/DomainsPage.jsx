import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AlertCircle, Globe } from 'lucide-react';
import { superAdminApi } from '../api/superadmin';
import { PageHeader } from '../components/shared/PageHeader';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import DnsRecordsTable from '../components/domains/DnsRecordsTable';
import { formatDate } from '../lib/utils';

export default function DomainsPage() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['domains', search, tab],
    queryFn: () => superAdminApi.listDomains({
      search,
      limit: 50,
      verified: tab === 'pending' ? 'false' : undefined,
      domainStatus: tab === 'pending' ? 'pending' : undefined,
    }).then((r) => r.data),
  });

  const { data: pendingData } = useQuery({
    queryKey: ['domains-pending'],
    queryFn: () => superAdminApi.listPendingDns().then((r) => r.data),
    enabled: tab === 'pending',
  });

  const rows = tab === 'pending' ? (pendingData?.data || []) : (data?.data || []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Domains"
        description="Tenant subdomains and custom domains. Pending DNS setups appear here with records to add."
      />

      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: 'All Domains' },
          { id: 'pending', label: 'Pending DNS' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              tab === t.id
                ? 'bg-violet-600 text-white shadow-md'
                : 'border border-[var(--border)] bg-white text-[var(--text-muted)] hover:text-violet-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'pending' && rows.length > 0 && (
        <Card className="border-amber-200/60 bg-amber-50/30 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-900">{rows.length} companies waiting for DNS update</p>
              <p className="text-sm text-amber-800/80">
                These customers signed up with a custom domain but have not verified DNS yet.
                Share the records below or verify on their behalf.
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-4">
        <Input
          className="mb-4 max-w-sm"
          placeholder="Search domain…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {tab === 'pending' ? (
          <div className="space-y-4">
            {isLoading ? (
              <p className="py-10 text-center text-sm text-[var(--text-muted)]">Loading…</p>
            ) : rows.length === 0 ? (
              <p className="py-10 text-center text-sm text-[var(--text-muted)]">No pending DNS setups</p>
            ) : (
              rows.map((r) => (
                <div key={r.id || r.companyId} className="rounded-2xl border border-[var(--border)] p-5">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-lg">{r.companyName}</p>
                      <p className="text-sm text-[var(--text-muted)]">{r.ownerEmail}</p>
                      <p className="mt-1 font-mono text-sm text-violet-700">{r.primaryDomain || r.customDomain}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-amber-500/15 text-amber-700">DNS Pending</Badge>
                      <Link to={`/admin/companies/${r.companyId || r.id}`}>
                        <Button variant="outline" size="sm">View Company</Button>
                      </Link>
                    </div>
                  </div>
                  <DnsRecordsTable domain={r.primaryDomain || r.customDomain} records={r.records || []} />
                  <p className="mt-3 text-xs text-[var(--text-muted)]">
                    Signed up {formatDate(r.createdAt)} · System URL: {r.systemDomain || r.subdomainUrl}
                  </p>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80 text-left text-xs uppercase text-[var(--text-muted)]">
                <tr>{['Company', 'Subdomain', 'Custom Domain', 'Type', 'Status', 'Verified', ''].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="py-10 text-center">Loading…</td></tr>
                ) : rows.map((r) => (
                  <tr key={r.id} className="border-t border-[var(--border)]">
                    <td className="px-4 py-3 font-medium">{r.companyName}</td>
                    <td className="px-4 py-3">{r.subdomainUrl || r.systemDomain}</td>
                    <td className="px-4 py-3">{r.primaryDomain || '—'}</td>
                    <td className="px-4 py-3 capitalize">{r.domainType}</td>
                    <td className="px-4 py-3">{r.domainStatus || r.status}</td>
                    <td className="px-4 py-3">
                      <Badge className={r.domainVerified ? 'bg-emerald-500/15 text-emerald-700' : 'bg-amber-500/15 text-amber-700'}>
                        {r.domainVerified ? 'Verified' : 'Pending'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/admin/companies/${r.companyId || r.id}`} className="text-violet-600 hover:underline">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
