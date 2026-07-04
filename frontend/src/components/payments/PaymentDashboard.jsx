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
import {
  DEMO_ACTIVITY,
  DEMO_COLLECTION_TREND,
  DEMO_DASHBOARD_KPIS,
  DEMO_DUE_VS_RECEIVED,
  DEMO_METHOD_SPLIT,
  DEMO_MONTHLY_REVENUE,
} from './paymentsDemoData';
import { daysUntil, formatDate, formatINRFull, priorityFromDays } from './paymentsUtils';
import { useCustomerPayments } from './useCustomerPayments';
import { usePaymentsUi } from './PaymentsContext';
import { cn } from '../../lib/utils';

const tooltipStyle = {
  background: 'var(--surface, #fff)',
  border: '1px solid var(--border-subtle, #e2e8f0)',
  borderRadius: 12,
  fontSize: 12,
};

export default function PaymentDashboard() {
  const { payments } = useCustomerPayments();
  const { openPayment } = usePaymentsUi();
  const kpis = DEMO_DASHBOARD_KPIS;

  const upcoming = payments
    .filter((p) => p.pending > 0)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Payments Dashboard"
        description="Finance overview — collections, dues, refunds, and live activity"
        breadcrumbs={['Payments', 'Dashboard']}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <FinanceKpiCard label="Today's Collection" value={kpis.todayCollection} format="inr" icon={IndianRupee} gradient="from-emerald-500 to-teal-600" trend="+12%" index={0} />
        <FinanceKpiCard label="This Month Collection" value={kpis.monthCollection} format="inr" icon={Wallet} gradient="from-violet-500 to-indigo-600" trend="+8%" index={1} />
        <FinanceKpiCard label="Outstanding Amount" value={kpis.outstanding} format="inr" icon={AlertCircle} gradient="from-amber-500 to-orange-600" index={2} />
        <FinanceKpiCard label="Pending Payments" value={kpis.pendingCount} icon={Clock} gradient="from-sky-500 to-blue-600" hint="Open customer dues" index={3} />
        <FinanceKpiCard label="Supplier Due" value={kpis.supplierDue} format="inr" icon={Building2} gradient="from-rose-500 to-pink-600" index={4} />
        <FinanceKpiCard label="Refund Pending" value={kpis.refundPending} format="inr" icon={RotateCcw} gradient="from-fuchsia-500 to-purple-600" index={5} />
        <FinanceKpiCard label="Profit Received" value={kpis.profitReceived} format="inr" icon={TrendingUp} gradient="from-cyan-500 to-teal-600" trend="+5%" index={6} />
        <FinanceKpiCard label="Payment Success %" value={kpis.successRate} format="percent" icon={Percent} gradient="from-lime-500 to-emerald-600" index={7} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Monthly Revenue">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={DEMO_MONTHLY_REVENUE}>
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
          </div>
        </SectionCard>

        <SectionCard title="Payment Methods">
          <div className="flex h-64 items-center gap-4">
            <div className="h-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={DEMO_METHOD_SPLIT} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                    {DEMO_METHOD_SPLIT.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="w-36 space-y-2">
              {DEMO_METHOD_SPLIT.map((m) => (
                <li key={m.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-content-secondary">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: m.color }} />
                    {m.name}
                  </span>
                  <span className="font-semibold text-content-primary">{m.value}%</span>
                </li>
              ))}
            </ul>
          </div>
        </SectionCard>

        <SectionCard title="Collection Trend">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DEMO_COLLECTION_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-content-muted/20" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v / 1000}k`} width={48} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatINRFull(v)} />
                <Bar dataKey="amount" fill="#06B6D4" radius={[8, 8, 0, 0]} name="Collected" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Due vs Received">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DEMO_DUE_VS_RECEIVED}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-content-muted/20" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v / 1000}k`} width={48} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatINRFull(v)} />
                <Legend />
                <Bar dataKey="due" fill="#F59E0B" radius={[6, 6, 0, 0]} name="Due" />
                <Bar dataKey="received" fill="#10B981" radius={[6, 6, 0, 0]} name="Received" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Recent Activity">
          <ol className="space-y-0">
            {DEMO_ACTIVITY.map((item, i) => (
              <li key={item.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className={cn('mt-1.5 h-2.5 w-2.5 rounded-full', activityDot(item.color))} />
                  {i < DEMO_ACTIVITY.length - 1 && <span className="my-1 w-px flex-1 bg-subtle" />}
                </div>
                <div className="pb-4">
                  <p className="text-sm font-medium text-content-primary">{item.text}</p>
                  <p className="text-xs text-content-muted">{item.detail}</p>
                  <p className="mt-0.5 text-[11px] text-content-muted">{item.time}</p>
                </div>
              </li>
            ))}
          </ol>
        </SectionCard>

        <SectionCard title="Upcoming Due Payments">
          <div className="space-y-3">
            {upcoming.map((p) => {
              const days = daysUntil(p.dueDate);
              const priority = priorityFromDays(days);
              return (
                <div
                  key={p.id}
                  className="flex flex-col gap-3 rounded-xl border border-subtle bg-surface-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <button type="button" onClick={() => openPayment(p)} className="text-left">
                    <p className="font-semibold text-content-primary">{p.customerName}</p>
                    <p className="text-xs text-content-muted">
                      {formatINRFull(p.pending)} · Due {formatDate(p.dueDate)}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <StatusBadge status={p.status} />
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
                  </button>
                  <Button size="sm" variant="outline" className="gap-1.5 shrink-0">
                    <Bell className="h-3.5 w-3.5" /> Reminder
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
