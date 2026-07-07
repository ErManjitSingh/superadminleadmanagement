import { useState } from 'react';
import {
  IndianRupee,
  Wallet,
  AlertCircle,
  Clock,
  Building2,
  RotateCcw,
  TrendingUp,
  Percent,
  Bell,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import PageHeader from '../ui/PageHeader';
import { Button } from '../ui/button';
import { FinanceKpiCard, SectionCard, StatusBadge } from './paymentsUi';
import { usePaymentsDashboard } from './usePaymentsDashboard';
import { sendPaymentReminder } from '../../services/bookingPaymentsApi';
import { daysUntil, formatDate, formatINRFull, priorityFromDays } from './paymentsUtils';
import { useCustomerPayments } from './useCustomerPayments';
import { cn } from '../../lib/utils';

const METHOD_COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EC4899', '#6366F1'];

const tooltipStyle = {
  background: 'var(--surface, #fff)',
  border: '1px solid var(--border-subtle, #e2e8f0)',
  borderRadius: 12,
  fontSize: 12,
};

export default function PaymentDashboard() {
  const { payments } = useCustomerPayments({});
  const { data: dashData, loading: dashLoading, reload } = usePaymentsDashboard();
  const [remindingId, setRemindingId] = useState(null);
  const kpis = dashData?.kpis || {};

  const monthlyRevenue = dashData?.monthlyRevenue || [];
  const collectionTrend = (dashData?.collectionTrend || []).map((d) => ({ day: d.label, amount: d.amount }));
  const methodSplit = (dashData?.methodSplit || []).map((m, i) => ({
    ...m,
    color: METHOD_COLORS[i % METHOD_COLORS.length],
    value: m.value,
  }));
  const methodTotal = methodSplit.reduce((s, m) => s + m.value, 0) || 1;
  const methodSplitPct = methodSplit.map((m) => ({
    ...m,
    value: Math.round((m.value / methodTotal) * 100),
  }));
  const pendingVsPaid = dashData?.pendingVsPaid || [];
  const recentTx = dashData?.recentTransactions || [];

  const upcoming = (dashData?.upcomingDue || payments
    .filter((p) => p.pending > 0)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)))
    .slice(0, 5);

  const handleReminder = async (bookingId) => {
    if (!bookingId) return;
    setRemindingId(bookingId);
    try {
      const result = await sendPaymentReminder(bookingId);
      if (result?.results?.waMeUrl) {
        window.open(result.results.waMeUrl, '_blank', 'noopener,noreferrer');
      }
      reload();
    } finally {
      setRemindingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Payments Dashboard"
        description="Finance overview — collections, dues, refunds, and live activity"
        breadcrumbs={['Payments', 'Dashboard']}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <FinanceKpiCard label="Today's Collection" value={kpis.todayCollection || 0} format="inr" icon={IndianRupee} gradient="from-emerald-500 to-teal-600" index={0} />
        <FinanceKpiCard label="Monthly Collection" value={kpis.monthCollection || 0} format="inr" icon={Wallet} gradient="from-violet-500 to-indigo-600" index={1} />
        <FinanceKpiCard label="Outstanding Amount" value={kpis.outstanding || 0} format="inr" icon={AlertCircle} gradient="from-amber-500 to-orange-600" index={2} />
        <FinanceKpiCard label="Pending Payments" value={kpis.pendingCount || 0} icon={Clock} gradient="from-sky-500 to-blue-600" hint="Bookings with balance due" index={3} />
        <FinanceKpiCard label="Upcoming Due" value={kpis.upcomingDueCount || 0} icon={Building2} gradient="from-rose-500 to-pink-600" index={4} />
        <FinanceKpiCard label="Fully Paid Bookings" value={kpis.fullyPaidBookings || 0} icon={RotateCcw} gradient="from-fuchsia-500 to-purple-600" index={5} />
        <FinanceKpiCard label="Total Transactions" value={kpis.totalTransactions || 0} icon={TrendingUp} gradient="from-cyan-500 to-teal-600" index={6} />
        <FinanceKpiCard label="Pending Amount" value={kpis.pendingAmount || 0} format="inr" icon={Percent} gradient="from-lime-500 to-emerald-600" index={7} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Monthly Revenue">
          <div className="h-64">
            {dashLoading ? (
              <div className="h-full rounded-xl bg-slate-100 animate-pulse" />
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenue}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-content-muted/20" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v / 1000}k`} width={48} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatINRFull(v)} />
                <Area type="monotone" dataKey="revenue" stroke="#8B5CF6" fill="url(#revFill)" strokeWidth={2} name="Revenue" />
                <Area type="monotone" dataKey="received" stroke="#10B981" fill="transparent" strokeWidth={2} name="Received" />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Payment Methods">
          <div className="flex h-64 items-center gap-4">
            <div className="h-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={methodSplit} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                    {methodSplit.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatINRFull(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="w-36 space-y-2">
              {methodSplit.map((m) => (
                <li key={m.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-content-secondary capitalize">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: m.color }} />
                    {m.name?.replace(/_/g, ' ')}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </SectionCard>

        <SectionCard title="Collection Trend">
          <div className="h-56">
            {dashLoading ? (
              <div className="h-full rounded-xl bg-slate-100 animate-pulse" />
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={collectionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-content-muted/20" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v / 1000}k`} width={48} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatINRFull(v)} />
                <Bar dataKey="amount" fill="#06B6D4" radius={[8, 8, 0, 0]} name="Collected" />
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Pending vs Paid">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pendingVsPaid}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-content-muted/20" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={32} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="#8B5CF6" radius={[6, 6, 0, 0]} name="Bookings" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Recent Transactions"
          action={recentTx.length > 6 ? (
            <span className="text-[11px] text-content-muted">{recentTx.length} total · scroll for more</span>
          ) : null}
        >
          <ol className={cn('space-y-0', recentTx.length > 6 && 'max-h-[26rem] overflow-y-auto pr-1 scrollbar-thin')}>
            {recentTx.length === 0 && (
              <p className="text-sm text-content-muted py-8 text-center">No transactions yet</p>
            )}
            {recentTx.map((item, i) => (
              <li key={item._id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  {i < recentTx.length - 1 && <span className="my-1 w-px flex-1 bg-subtle" />}
                </div>
                <div className="pb-4">
                  <p className="text-sm font-medium text-content-primary">{item.customerName} — {formatINRFull(item.amount)}</p>
                  <p className="text-xs text-content-muted">{item.receiptNumber} · {item.booking?.bookingNumber}</p>
                  <p className="mt-0.5 text-[11px] text-content-muted">{formatDate(item.paymentDate || item.createdAt)}</p>
                </div>
              </li>
            ))}
          </ol>
        </SectionCard>

        <SectionCard title="Upcoming Due Payments">
          <div className="space-y-3">
            {upcoming.map((p) => {
              const dueDate = p.travelDate || p.dueDate;
              const days = dueDate ? daysUntil(dueDate) : null;
              const priority = days != null ? priorityFromDays(days) : { label: '—', color: 'slate' };
              const remaining = Math.max(0, (p.totalAmount || 0) - (p.totalPaid || p.advanceReceived || 0));
              return (
                <div
                  key={p._id || p.id}
                  className="flex flex-col gap-3 rounded-xl border border-subtle bg-surface-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="text-left">
                    <p className="font-semibold text-content-primary">{p.customerName}</p>
                    <p className="text-xs text-content-muted">
                      {formatINRFull(remaining || p.pending)} · Travel {formatDate(dueDate)}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <StatusBadge status={p.paymentStatus || p.status} />
                      <span
                        className={cn(
                          'text-[11px] font-semibold',
                          priority.color === 'rose' && 'text-rose-600',
                          priority.color === 'orange' && 'text-orange-600',
                          priority.color === 'amber' && 'text-amber-600',
                          priority.color === 'emerald' && 'text-emerald-600',
                          priority.color === 'slate' && 'text-slate-500'
                        )}
                      >
                        {priority.label}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 shrink-0"
                    disabled={!p._id || remindingId === p._id}
                    onClick={() => handleReminder(p._id)}
                  >
                    {remindingId === p._id ? (
                      <span className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Bell className="h-3.5 w-3.5" />
                    )}
                    Reminder
                  </Button>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function activityDot(color) {
  const map = {
    emerald: 'bg-emerald-500',
    violet: 'bg-violet-500',
    sky: 'bg-sky-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
  };
  return map[color] || 'bg-slate-400';
}
