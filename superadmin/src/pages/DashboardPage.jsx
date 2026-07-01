import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
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
  HardDrive,
  IndianRupee,
  TrendingUp,
  Users,
} from 'lucide-react';
import { superAdminApi } from '../api/superadmin';
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { MetricSkeleton } from '../components/ui/skeleton';
import { cn, formatCurrency, formatDate, STATUS_COLORS } from '../lib/utils';

function MetricCard({ title, value, icon: Icon, accent }) {
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 300 }}>
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
    </motion.div>
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
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <MetricSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  const m = data?.metrics || {};

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Dashboard</h1>
        <p className="mt-1 text-[var(--text-secondary)]">
          SaaS metrics only — company business data is never shown here.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total Companies" value={m.totalCompanies} icon={Building2} accent="bg-brand-500/15 text-brand-600" />
        <MetricCard title="Active Companies" value={m.activeCompanies} icon={TrendingUp} accent="bg-emerald-500/15 text-emerald-600" />
        <MetricCard title="Trial Companies" value={m.trialCompanies} icon={Clock} accent="bg-amber-500/15 text-amber-600" />
        <MetricCard title="Suspended" value={m.suspendedCompanies} icon={Activity} accent="bg-red-500/15 text-red-600" />
        <MetricCard title="New Today" value={m.newCompaniesToday} icon={Building2} accent="bg-violet-500/15 text-violet-600" />
        <MetricCard title="Company Users" value={m.totalCompanyUsers} icon={Users} accent="bg-sky-500/15 text-sky-600" />
        <MetricCard title="Monthly Revenue" value={formatCurrency(m.monthlyRevenue)} icon={IndianRupee} accent="bg-emerald-500/15 text-emerald-600" />
        <MetricCard title="Yearly Revenue" value={formatCurrency(m.yearlyRevenue)} icon={IndianRupee} accent="bg-indigo-500/15 text-indigo-600" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Company Registrations</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <div className="h-64">
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
          <CardHeader>
            <CardTitle>Subscription Summary</CardTitle>
            <CardDescription>Active tenants by plan</CardDescription>
          </CardHeader>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Object.entries(data?.subscriptionSummary?.planBreakdown || {}).map(([slug, count]) => ({
                  plan: slug,
                  count,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="plan" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Company Registrations</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {(data?.recentCompanies || []).map((c) => (
              <div key={c._id} className="flex items-center justify-between rounded-xl border border-[var(--border)] px-3 py-2.5">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{c.ownerEmail}</p>
                </div>
                <Badge className={STATUS_COLORS[c.status]}>{c.status}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Storage Usage
              </CardTitle>
            </CardHeader>
            <p className="text-2xl font-bold">
              {(m.storageUsedMb / 1024).toFixed(1)} GB
              <span className="text-base font-normal text-[var(--text-muted)]"> / {m.storageLimitGb} GB limit</span>
            </p>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Server Status
              </CardTitle>
            </CardHeader>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-sm">Database: {data?.serverStatus?.database?.state || 'unknown'}</span>
            </div>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              Upcoming renewals: {m.upcomingRenewals} · Expiring trials: {m.expiringTrials}
            </p>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platform Activity</CardTitle>
            </CardHeader>
            <div className="max-h-48 space-y-2 overflow-auto">
              {(data?.auditLogs || []).slice(0, 6).map((log) => (
                <div key={log._id} className="text-sm">
                  <span className="font-medium">{log.action}</span>
                  <span className="text-[var(--text-muted)]"> · {log.resourceType}</span>
                  <p className="text-xs text-[var(--text-muted)]">{formatDate(log.createdAt)}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
