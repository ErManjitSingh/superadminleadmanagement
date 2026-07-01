import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { superAdminApi } from '../api/superadmin';
import { PageHeader } from '../components/shared/PageHeader';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Select } from '../components/ui/input';
import { formatCurrency, formatDate, STATUS_COLORS } from '../lib/utils';

export default function SubscriptionsPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['subscriptions', status, page],
    queryFn: () => superAdminApi.listSubscriptions({ status, page, limit: 20 }).then((r) => r.data),
  });

  const rows = data?.data || [];
  const pagination = data?.pagination || {};

  return (
    <div className="space-y-6">
      <PageHeader title="Subscriptions" description="Billing and renewal status per tenant — metadata only." />
      <Card className="p-4">
        <div className="mb-4"><Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-44"><option value="">All statuses</option>{['active','trial','expired','suspended'].map((s) => <option key={s} value={s}>{s}</option>)}</Select></div>
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 text-left text-xs uppercase text-[var(--text-muted)] dark:bg-slate-900/50">
              <tr>
                {['Company', 'Plan', 'Cycle', 'Price', 'Renewal', 'Trial End', 'Status', 'Auto Renew', ''].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {isLoading ? <tr><td colSpan={9} className="px-4 py-10 text-center">Loading…</td></tr> : rows.map((r) => (
                <tr key={r.id} className="border-t border-[var(--border)]">
                  <td className="px-4 py-3 font-medium">{r.companyName}</td>
                  <td className="px-4 py-3">{r.plan?.name || '—'}</td>
                  <td className="px-4 py-3 capitalize">{r.billingCycle}</td>
                  <td className="px-4 py-3">{formatCurrency(r.price, r.currency)}</td>
                  <td className="px-4 py-3">{r.renewalDate ? formatDate(r.renewalDate) : '—'}</td>
                  <td className="px-4 py-3">{r.trialEndDate ? formatDate(r.trialEndDate) : '—'}</td>
                  <td className="px-4 py-3"><Badge className={STATUS_COLORS[r.status]}>{r.status}</Badge></td>
                  <td className="px-4 py-3">{r.autoRenewal ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3"><Link to={`/admin/companies/${r.companyId}`}><Button size="sm" variant="outline">Manage</Button></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <Button variant="outline" size="sm" disabled={page >= (pagination.totalPages || 1)} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </Card>
    </div>
  );
}
