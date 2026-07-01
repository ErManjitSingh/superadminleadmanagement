import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { superAdminApi } from '../api/superadmin';
import { PageHeader } from '../components/shared/PageHeader';
import { Card, CardHeader, CardTitle } from '../components/ui/card';
import { formatCurrency } from '../lib/utils';

export default function ReportsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['reports'], queryFn: () => superAdminApi.getReports().then((r) => r.data) });

  if (isLoading) return <p>Loading reports…</p>;

  return (
    <div className="space-y-6">
      <PageHeader title="Platform Reports" description="Aggregated SaaS metrics — no tenant CRM data." />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5"><p className="text-sm text-[var(--text-muted)]">Revenue This Month</p><p className="mt-2 text-2xl font-bold">{formatCurrency(data?.revenueThisMonth)}</p></Card>
        <Card className="p-5"><p className="text-sm text-[var(--text-muted)]">Open Support Tickets</p><p className="mt-2 text-2xl font-bold">{data?.openSupportTickets}</p></Card>
        <Card className="p-5"><p className="text-sm text-[var(--text-muted)]">Paid Invoices</p><p className="mt-2 text-2xl font-bold">{data?.paidInvoicesCount}</p></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Signups by Month</CardTitle></CardHeader>
        <div className="h-64 px-2 pb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.signupsByMonth || []}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
