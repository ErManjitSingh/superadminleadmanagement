import { Link } from 'react-router-dom';
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
import { ArrowLeftRight, Banknote, CreditCard, Landmark, Smartphone } from 'lucide-react';
import PaymentDashboardHeader from './PaymentDashboardHeader';
import PaymentKpiStrip from './PaymentKpiStrip';
import { SectionCard } from './paymentsUi';
import { usePaymentsDashboard } from './usePaymentsDashboard';
import { formatINRFull } from './paymentsUtils';
import {
  buildMethodSplitChart,
  buildMonthlyPendingVsPaid,
  formatDateTime,
  methodColor,
  methodLabel,
} from './paymentDashboardUtils';
import { cn } from '../../lib/utils';

const tooltipStyle = {
  background: 'var(--surface, #fff)',
  border: '1px solid var(--border-subtle, #e2e8f0)',
  borderRadius: 12,
  fontSize: 12,
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
};

const METHOD_ICONS = {
  upi: Smartphone,
  card: CreditCard,
  bank_transfer: Landmark,
  net_banking: Landmark,
  cash: Banknote,
};

function ChartSkeleton({ className }) {
  return <div className={cn('rounded-xl bg-slate-100 dark:bg-slate-800/50 animate-pulse', className)} />;
}

function MethodDonutCenter({ total }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
      <p className="text-lg font-bold text-content-primary tabular-nums">{formatINRFull(total)}</p>
      <p className="text-[10px] font-medium text-content-muted">Total Collection</p>
    </div>
  );
}

function TransactionIcon({ mode }) {
  const key = String(mode || '').toLowerCase();
  const Icon = METHOD_ICONS[key] || ArrowLeftRight;
  const color = methodColor(key);
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
      style={{ background: color }}
    >
      <Icon className="h-4 w-4" />
    </span>
  );
}

export default function PaymentDashboard() {
  const { data: dashData, loading: dashLoading } = usePaymentsDashboard();
  const kpis = dashData?.kpis || {};

  const monthlyRevenue = dashData?.monthlyRevenue || [];
  const collectionTrend = (dashData?.collectionTrend || []).map((d) => ({ day: d.label, amount: d.amount }));
  const weekTrend = collectionTrend.slice(-7).map((d) => d.amount);
  const monthTrend = monthlyRevenue.map((m) => m.received || 0);
  const methodSplit = buildMethodSplitChart(dashData?.methodSplit || []);
  const methodTotal = methodSplit.reduce((s, m) => s + m.amount, 0);
  const pendingVsPaidMonthly = buildMonthlyPendingVsPaid(monthlyRevenue);
  const recentTx = (dashData?.recentTransactions || []).slice(0, 4);

  return (
    <div className="space-y-5 pb-4">
      <PaymentDashboardHeader />

      <PaymentKpiStrip
        kpis={kpis}
        weekTrend={weekTrend}
        monthTrend={monthTrend}
        loading={dashLoading}
      />

      <div className="grid gap-4 xl:grid-cols-5">
        <SectionCard title="Monthly Revenue Overview" period="This Year" className="xl:col-span-3">
          <div className="h-72">
            {dashLoading ? (
              <ChartSkeleton className="h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRevenue} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revFillPurple" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="revFillTeal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#14B8A6" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#14B8A6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-content-muted/15" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v / 1000}k`} width={48} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v, name) => [formatINRFull(v), name]}
                    labelFormatter={(label) => `${label} 2026`}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ fontSize: 11, paddingBottom: 12 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8B5CF6"
                    fill="url(#revFillPurple)"
                    strokeWidth={2.5}
                    name="Total Collection"
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="received"
                    stroke="#14B8A6"
                    fill="url(#revFillTeal)"
                    strokeWidth={2.5}
                    name="Received Amount"
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Payment Methods Distribution" period="This Month" className="xl:col-span-2">
          <div className="flex h-72 items-center gap-4">
            {dashLoading ? (
              <ChartSkeleton className="h-full w-full" />
            ) : (
              <>
                <div className="relative h-full flex-1 min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={methodSplit}
                        dataKey="amount"
                        nameKey="name"
                        innerRadius={62}
                        outerRadius={92}
                        paddingAngle={2}
                        strokeWidth={0}
                      >
                        {methodSplit.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatINRFull(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <MethodDonutCenter total={methodTotal} />
                </div>
                <ul className="w-40 space-y-3 shrink-0">
                  {methodSplit.map((m) => (
                    <li key={m.name} className="space-y-0.5">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="flex items-center gap-2 text-content-secondary min-w-0">
                          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: m.color }} />
                          <span className="truncate">{m.name}</span>
                        </span>
                        <span className="font-semibold text-content-primary shrink-0">{m.pct}%</span>
                      </div>
                      <p className="pl-4 text-[11px] text-content-muted tabular-nums">{formatINRFull(m.amount)}</p>
                    </li>
                  ))}
                  {methodSplit.length === 0 && (
                    <p className="text-xs text-content-muted">No payments yet</p>
                  )}
                </ul>
              </>
            )}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard title="Collection Trend" period="This Week">
          <div className="h-56">
            {dashLoading ? (
              <ChartSkeleton className="h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekTrend.length ? collectionTrend.slice(-7) : collectionTrend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#6366F1" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-content-muted/15" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${v / 1000}k`} width={42} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatINRFull(v)} />
                  <Bar dataKey="amount" fill="url(#barGrad)" radius={[6, 6, 0, 0]} name="Collected" maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Pending vs Paid" period="This Month">
          <div className="h-56">
            {dashLoading ? (
              <ChartSkeleton className="h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pendingVsPaidMonthly} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-content-muted/15" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${v / 1000}k`} width={42} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatINRFull(v)} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="paid" stackId="stack" fill="#10B981" name="Paid Amount" radius={[0, 0, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="pending" stackId="stack" fill="#F43F5E" name="Pending Amount" radius={[6, 6, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Recent Transactions"
          action={(
            <Link to="/payments/transactions" className="text-[11px] font-semibold text-violet-600 hover:text-violet-700">
              View All
            </Link>
          )}
        >
          <div className="space-y-1">
            {dashLoading && (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            )}
            {!dashLoading && recentTx.length === 0 && (
              <p className="py-10 text-center text-sm text-content-muted">No transactions yet</p>
            )}
            {!dashLoading && recentTx.map((item) => (
              <div
                key={item._id}
                className="flex items-center gap-3 rounded-xl border border-transparent px-1 py-2.5 hover:border-subtle hover:bg-surface-muted/40 transition-colors"
              >
                <TransactionIcon mode={item.mode} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-content-primary truncate">
                    {item.receiptNumber || 'Payment'}
                  </p>
                  <p className="text-[11px] text-content-muted truncate">
                    {item.customerName} · {methodLabel(item.mode)}
                  </p>
                  <p className="text-[10px] text-content-muted mt-0.5">
                    {formatDateTime(item.paymentDate || item.createdAt)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-content-primary tabular-nums">{formatINRFull(item.amount)}</p>
                  <span className="mt-1 inline-flex rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                    Success
                  </span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
