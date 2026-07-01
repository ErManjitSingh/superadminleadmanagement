import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { superAdminApi } from '../api/superadmin';
import { PageHeader } from '../components/shared/PageHeader';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { formatDate } from '../lib/utils';

export default function DomainsPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['domains', search],
    queryFn: () => superAdminApi.listDomains({ search, limit: 50 }).then((r) => r.data),
  });

  const rows = data?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader title="Domains" description="Tenant subdomain and custom domain registry." />
      <Card className="p-4">
        <Input className="mb-4 max-w-sm" placeholder="Search domain…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 text-left text-xs uppercase text-[var(--text-muted)]"><tr>{['Company', 'Subdomain', 'Custom Domain', 'Type', 'Status', 'Verified', ''].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
            <tbody>
              {isLoading ? <tr><td colSpan={7} className="py-10 text-center">Loading…</td></tr> : rows.map((r) => (
                <tr key={r.id} className="border-t border-[var(--border)]">
                  <td className="px-4 py-3 font-medium">{r.companyName}</td>
                  <td className="px-4 py-3">{r.subdomainUrl}</td>
                  <td className="px-4 py-3">{r.primaryDomain || '—'}</td>
                  <td className="px-4 py-3 capitalize">{r.domainType}</td>
                  <td className="px-4 py-3">{r.status}</td>
                  <td className="px-4 py-3"><Badge className={r.domainVerified ? 'bg-emerald-500/15 text-emerald-700' : 'bg-amber-500/15 text-amber-700'}>{r.domainVerified ? 'Verified' : 'Pending'}</Badge></td>
                  <td className="px-4 py-3"><Link to={`/admin/companies/${r.companyId}`} className="text-violet-600 hover:underline">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
