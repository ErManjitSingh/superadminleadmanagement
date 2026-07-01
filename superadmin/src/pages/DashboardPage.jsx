import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  Building2,
  Clock,
  Database,
  Globe,
  HardDrive,
  IndianRupee,
  LifeBuoy,
  Plus,
  Server,
  TrendingUp,
  Users,
} from 'lucide-react';
import { superAdminApi } from '../api/superadmin';
import { PageHeader } from '../components/shared/PageHeader';
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { MetricSkeleton } from '../components/ui/skeleton';
import { cn, formatCurrency, formatDate, STATUS_COLORS } from '../lib/utils';

const PIE_COLORS = ['#6366f1', '#8b5cf6', '#f59e0b', '#ef4444'];

function MetricCard({ title, value, icon: Icon, accent }) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--text-secondary)]">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
        </div>
        <div className={cn('rounded-xl p-2.5', accent)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => superAdminApi.getDashboard().then((r) => r.data),
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => <MetricSkeleton key={i} />)}
      </div>
    );
  }

  const m = data?.metrics || {};

  return (
    <div className="space-y-8">
      <PageHeader
        title="Platform Dashboard"
        description="SaaS metrics only — tenant CRM data (leads, bookings, quotations) is never shown here."
      >
        <Link to="/admin/companies/new"><Button><Plus className="h-4 w-4" />Create Company</Button></Link>
        <Link to="/admin/plans"><Button variant="outline">Manage Plans</Button></Link>
        <Link to="/admin/announcements"><Button variant="outline">Send Announcement</Button></Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total Companies" value={m.totalCompanies} icon={Building2} accent="bg-brand-500/15 text-brand-600" />
        <MetricCard title="Active" value={m.activeCompanies} icon={TrendingUp} accent="bg-emerald-500/15 text-emerald-600" />
        <MetricCard title="Trial" value={m.trialCompanies} icon={Clock} accent="bg-amber-500/15 text-amber-600" />
        <MetricCard title="Expired" value={m.expiredCompanies} icon={Activity} accent="bg-slate-500/15 text-slate-600" />
        <MetricCard title="Suspended" value={m.suspendedCompanies} icon={Activity} accent="bg-red-500/15 text-red-600" />
        <MetricCard title="Monthly Revenue" value={formatCurrency(m.monthlyRevenue)} icon={IndianRupee} accent="bg-emerald-500/15 text-emerald-600" />
        <MetricCard title="New This Month" value={m.newCompaniesThisMonth} icon={Building2} accent="bg-violet-500/15 text-violet-600" />
        <MetricCard title="Domains Connected" value={m.domainsConnected} icon={Globe} accent="bg-sky-500/15 text-sky-600" />
        <MetricCard title="DNS Pending" value={m.dnsPending} icon={Globe} accent="bg-orange-500/15 text-orange-600" />
        <MetricCard title="Company Users" value={m.totalCompanyUsers} icon={Users} accent="bg-indigo-500/15 text-indigo-600" />
        <MetricCard title="Open Tickets" value={m.pendingSupportTickets} icon={LifeBuoy} accent="bg-rose-500/15 text-rose-600" />
        <MetricCard title="Server Health" value={data?.serverStatus?.health || '—'} icon={Server} accent="bg-emerald-500/15 text-emerald-600" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Company Growth</CardTitle><CardDescription>Last 30 days</CardDescription></CardHeader>
          <div className="h-64 px-2 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.registrationTrend || []}>
                <defs>
                  <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#regGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle>Active vs Expired</CardTitle></CardHeader>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data?.statusTrend || []} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                  {(data?.statusTrend || []).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Plan Distribution</CardTitle></CardHeader>
          <div className="h-56 px-2 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={Object.entries(data?.subscriptionSummary?.planBreakdown || {}).map(([plan, count]) => ({ plan, count }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="plan" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><HardDrive className="h-5 w-5" />Storage Used</CardTitle></CardHeader>
          <p className="px-6 pb-6 text-2xl font-bold">
            {(m.storageUsedMb / 1024).toFixed(1)} GB
            <span className="text-base font-normal text-[var(--text-muted)]"> / {m.storageLimitGb} GB limit</span>
          </p>
          <div className="flex items-center gap-2 px-6 pb-6 text-sm">
            <Database className="h-4 w-4" />
            DB: {data?.serverStatus?.database?.state || 'unknown'}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Recent Companies</CardTitle></CardHeader>
          <div className="space-y-2 px-2 pb-4">
            {(data?.recentCompanies || []).map((c) => (
              <Link key={c._id} to={`/admin/companies/${c._id}`} className="flex items-center justify-between rounded-xl border border-[var(--border)] px-3 py-2.5 transition hover:bg-white/50 dark:hover:bg-white/5">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{c.ownerEmail}</p>
                </div>
                <Badge className={STATUS_COLORS[c.status]}>{c.status}</Badge>
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle>Latest Payments</CardTitle></CardHeader>
          <div className="space-y-2 px-2 pb-4">
            {(data?.recentPayments || []).length === 0 ? (
              <p className="px-3 text-sm text-[var(--text-muted)]">No invoices yet</p>
            ) : (
              data.recentPayments.map((p) => (
                <div key={p.id} className="rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm">
                  <p className="font-medium">{p.companyName || 'Company'}</p>
                  <p className="text-[var(--text-muted)]">{formatCurrency(p.amount)} · {p.status}</p>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle>Pending DNS</CardTitle></CardHeader>
          <div className="space-y-2 px-2 pb-4">
            {(data?.pendingDomainVerification || []).length === 0 ? (
              <p className="px-3 text-sm text-[var(--text-muted)]">All domains verified</p>
            ) : (
              data.pendingDomainVerification.map((d) => (
                <div key={d._id} className="rounded-xl border border-amber-200/50 bg-amber-50/50 px-3 py-2.5 text-sm dark:border-amber-900/30 dark:bg-amber-950/20">
                  <p className="font-medium">{d.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{d.primaryDomain}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Platform Activity</CardTitle></CardHeader>
        <div className="grid gap-2 px-2 pb-4 sm:grid-cols-2">
          {(data?.auditLogs || []).slice(0, 8).map((log) => (
            <div key={log._id} className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm">
              <span className="font-medium">{log.action}</span>
              <span className="text-[var(--text-muted)]"> · {log.resourceType}</span>
              <p className="text-xs text-[var(--text-muted)]">{formatDate(log.createdAt)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
