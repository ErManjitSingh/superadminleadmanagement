import { useQuery } from '@tanstack/react-query';
import { superAdminApi } from '../api/superadmin';
import { PageHeader } from '../components/shared/PageHeader';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { formatCurrency, formatDate } from '../lib/utils';

export default function InvoicesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => superAdminApi.listInvoices({ limit: 50 }).then((r) => r.data),
  });

  const rows = data?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader title="Invoices" description="Platform billing invoices for tenant subscriptions." />
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/80 text-left text-xs uppercase text-[var(--text-muted)]"><tr>{['Invoice', 'Company', 'Amount', 'Cycle', 'Status', 'Due', 'Paid'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
          <tbody>
            {isLoading ? <tr><td colSpan={7} className="py-10 text-center">Loading…</td></tr> : rows.length === 0 ? <tr><td colSpan={7} className="py-10 text-center text-[var(--text-muted)]">No invoices yet</td></tr> : rows.map((r) => (
              <tr key={r.id} className="border-t border-[var(--border)]">
                <td className="px-4 py-3 font-mono text-xs">{r.invoiceNumber}</td>
                <td className="px-4 py-3">{r.companyName}</td>
                <td className="px-4 py-3">{formatCurrency(r.amount, r.currency)}</td>
                <td className="px-4 py-3 capitalize">{r.billingCycle}</td>
                <td className="px-4 py-3"><Badge>{r.status}</Badge></td>
                <td className="px-4 py-3">{r.dueDate ? formatDate(r.dueDate) : '—'}</td>
                <td className="px-4 py-3">{r.paidAt ? formatDate(r.paidAt) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
