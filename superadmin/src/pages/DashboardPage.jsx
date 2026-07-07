import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
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
  Globe,
  IndianRupee,
  LifeBuoy,
  Server,
  TrendingUp,
  Users,
} from 'lucide-react';
import { superAdminApi } from '../api/superadmin';
import { MetricSkeleton } from '../components/ui/skeleton';
import MetricSparkCard from '../components/dashboard/MetricSparkCard';
import QuickShortcuts from '../components/dashboard/QuickShortcuts';
import DnsRecordsTable from '../components/domains/DnsRecordsTable';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../lib/utils';

const PIE_COLORS = ['#6366f1', '#8b5cf6', '#f59e0b', '#ef4444'];

function buildSparkFromTrend(trend = [], key = 'count') {
  return (trend || []).slice(-7).map((r) => r[key] || 0);
}

function formatTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function activityMessage(log) {
  if (log.action?.includes('company') && log.resourceType === 'company') {
    return `New company registered on platform`;
  }
  if (log.action?.includes('plan')) return `Subscription plan updated`;
  if (log.action?.includes('domain')) return `Domain verification pending`;
  if (log.action?.includes('invoice') || log.action?.includes('payment')) {
    return `Invoice payment received`;
  }
  if (log.action?.includes('ticket')) return `New support ticket opened`;
  return log.action || 'Platform activity';
}

const ACTIVITY_ICONS = {
  company: Building2,
  plan: TrendingUp,
  domain: Globe,
  invoice: IndianRupee,
  ticket: LifeBuoy,
};

function activityIcon(log) {
  const type = log.resourceType || 'company';
  const Icon = ACTIVITY_ICONS[type] || Activity;
  return Icon;
}

export default function DashboardPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => superAdminApi.getDashboard().then((r) => r.data),
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-20 animate-pulse rounded-2xl bg-white/60" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => <MetricSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  const m = data?.metrics || {};
  const trend = data?.registrationTrend || [];
  const spark = buildSparkFromTrend(trend);
  const totalStatus = (data?.statusTrend || []).reduce((s, x) => s + (x.value || 0), 0);
  const activities = [
    ...(data?.recentCompanies || []).slice(0, 3).map((c) => ({
      id: c._id,
      message: `New company "${c.name}" registered`,
      time: c.createdAt,
      icon: Building2,
    })),
    ...(data?.auditLogs || []).slice(0, 5).map((log) => ({
      id: log._id,
      message: activityMessage(log),
      time: log.createdAt,
      icon: activityIcon(log),
    })),
  ].slice(0, 6);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `platform-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Welcome back, {user?.name?.split(' ')[0] || 'Super Admin'} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500">Here&apos;s what&apos;s happening on your platform today.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900"
          >
            Today, {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 hover:bg-violet-500"
          >
            Export Report
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricSparkCard title="Total Companies" value={m.totalCompanies?.toLocaleString() || '0'} change="+12%" icon={Building2} sparkData={spark} iconBg="bg-violet-500/15 text-violet-600" />
        <MetricSparkCard title="Active Companies" value={m.activeCompanies?.toLocaleString() || '0'} change="+8%" icon={TrendingUp} sparkData={spark} iconBg="bg-emerald-500/15 text-emerald-600" sparkColor="#10b981" />
        <MetricSparkCard title="Trial Companies" value={m.trialCompanies?.toLocaleString() || '0'} change="+5%" icon={Clock} sparkData={spark} iconBg="bg-amber-500/15 text-amber-600" sparkColor="#f59e0b" />
        <MetricSparkCard title="Expired Companies" value={m.expiredCompanies?.toLocaleString() || '0'} change="-2%" trendUp={false} icon={Activity} sparkData={spark} iconBg="bg-slate-500/15 text-slate-600" sparkColor="#94a3b8" />
        <MetricSparkCard title="Suspended Companies" value={m.suspendedCompanies?.toLocaleString() || '0'} change="-1%" trendUp={false} icon={Activity} sparkData={spark} iconBg="bg-red-500/15 text-red-600" sparkColor="#ef4444" />
        <MetricSparkCard title="Monthly Revenue" value={formatCurrency(m.monthlyRevenue)} change="+18%" icon={IndianRupee} sparkData={spark} iconBg="bg-emerald-500/15 text-emerald-600" sparkColor="#10b981" />
        <MetricSparkCard title="New Companies" value={m.newCompaniesThisMonth?.toLocaleString() || '0'} change="+15%" icon={Building2} sparkData={spark} iconBg="bg-indigo-500/15 text-indigo-600" />
        <MetricSparkCard title="Domains Connected" value={m.domainsConnected?.toLocaleString() || '0'} change="+6%" icon={Globe} sparkData={spark} iconBg="bg-sky-500/15 text-sky-600" sparkColor="#0ea5e9" />
        <MetricSparkCard title="DNS Pending" value={m.dnsPending?.toLocaleString() || '0'} change="-3%" trendUp={false} icon={Globe} sparkData={spark} iconBg="bg-orange-500/15 text-orange-600" sparkColor="#f97316" />
        <MetricSparkCard title="Company Users" value={m.totalCompanyUsers?.toLocaleString() || '0'} change="+10%" icon={Users} sparkData={spark} iconBg="bg-violet-500/15 text-violet-600" />
        <MetricSparkCard title="Open Tickets" value={m.pendingSupportTickets?.toLocaleString() || '0'} change="+4%" icon={LifeBuoy} sparkData={spark} iconBg="bg-rose-500/15 text-rose-600" sparkColor="#f43f5e" />
        <MetricSparkCard title="Server Health" value={data?.serverStatus?.health === 'healthy' ? 'Healthy' : 'Degraded'} icon={Server} sparkData={[9, 9, 10, 9, 10, 10, 10]} iconBg="bg-emerald-500/15 text-emerald-600" sparkColor="#10b981" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card xl:col-span-2 dark:border-slate-700/50 dark:bg-slate-900/80">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Company Growth</h3>
              <p className="text-xs text-slate-500">New companies registered in last 30 days</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v?.slice(5)} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#growthGrad)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card dark:border-slate-700/50 dark:bg-slate-900/80">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Active vs Expired Companies</h3>
          <p className="text-xs text-slate-500">Distribution by status</p>
          <div className="relative h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.statusTrend || []}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={88}
                  paddingAngle={3}
                >
                  {(data?.statusTrend || []).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalStatus}</p>
              <p className="text-xs text-slate-500">Total</p>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs">
            {(data?.statusTrend || []).map((s, i) => (
              <span key={s.name} className="inline-flex items-center gap-1.5 capitalize text-slate-600">
                <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                {s.name} ({s.value})
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card lg:col-span-2 dark:border-slate-700/50 dark:bg-slate-900/80">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Activities</h3>
            <Link to="/admin/logs" className="text-xs font-semibold text-violet-600 hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-1">
            {activities.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No recent activity</p>
            ) : (
              activities.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{item.message}</p>
                      <p className="text-xs text-slate-500">{formatDate(item.time)}</p>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-slate-400">{formatTime(item.time)}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card dark:border-slate-700/50 dark:bg-slate-900/80">
          <h3 className="mb-4 text-base font-bold text-slate-900 dark:text-white">Recent Companies</h3>
          <div className="space-y-2">
            {(data?.recentCompanies || []).slice(0, 5).map((c) => (
              <Link
                key={c._id}
                to={`/admin/companies/${c._id}`}
                className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5 transition hover:border-violet-200 hover:bg-violet-50/50 dark:border-slate-700 dark:hover:bg-violet-950/20"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">{c.name}</p>
                  <p className="truncate text-xs text-slate-500">{c.ownerEmail}</p>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                  {c.status}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {(data?.pendingDomainVerification || []).length > 0 && (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-5 shadow-card dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-amber-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Pending DNS Setup ({data.pendingDomainVerification.length})
                </h3>
                <p className="text-xs text-slate-500">Customers who signed up but haven&apos;t updated DNS yet</p>
              </div>
            </div>
            <Link to="/admin/domains" className="text-xs font-semibold text-violet-600 hover:underline">
              View all domains
            </Link>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {data.pendingDomainVerification.slice(0, 4).map((item) => (
              <div key={item.id || item.companyId} className="rounded-xl border border-amber-200/60 bg-white p-4 dark:bg-slate-900/60">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{item.companyName}</p>
                    <p className="font-mono text-xs text-violet-700">{item.primaryDomain || item.domain}</p>
                  </div>
                  <Link
                    to={`/admin/companies/${item.companyId || item.id}`}
                    className="shrink-0 text-xs font-semibold text-violet-600 hover:underline"
                  >
                    Open
                  </Link>
                </div>
                <DnsRecordsTable
                  compact
                  domain={item.primaryDomain || item.domain}
                  records={item.records || []}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <QuickShortcuts ticketCount={m.pendingSupportTickets || 0} />
    </div>
  );
}
