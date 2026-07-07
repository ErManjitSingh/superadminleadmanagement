import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  IndianRupee,
  Wallet,
} from 'lucide-react';
import KpiCard from '../dashboard/KpiCard';
import { buildSparkline } from '../operations-manager/bookings/bookingListUtils';
import { changeType, formatKpiInr, pctChangeLabel } from './paymentDashboardUtils';

const KPI_CONFIG = [
  {
    key: 'todayCollection',
    label: "Today's Collection",
    icon: IndianRupee,
    iconColor: 'bg-violet-500',
    sparkColor: '#8B5CF6',
    format: formatKpiInr,
    trendKey: 'todayCollection',
    prevKey: 'yesterdayCollection',
    changeLabel: 'vs yesterday',
    sparkFrom: 'week',
  },
  {
    key: 'monthCollection',
    label: 'Monthly Collection',
    icon: Wallet,
    iconColor: 'bg-emerald-500',
    sparkColor: '#10B981',
    format: formatKpiInr,
    trendKey: 'monthCollection',
    prevKey: 'prevMonthCollection',
    changeLabel: 'vs last month',
    sparkFrom: 'month',
  },
  {
    key: 'outstanding',
    label: 'Outstanding Amount',
    icon: AlertCircle,
    iconColor: 'bg-orange-500',
    sparkColor: '#F97316',
    format: formatKpiInr,
    changeLabel: 'vs last month',
    sparkFrom: 'pending',
  },
  {
    key: 'pendingCount',
    label: 'Pending Payments',
    icon: Clock,
    iconColor: 'bg-blue-500',
    sparkColor: '#3B82F6',
    changeLabel: 'Bookings with balance due',
    sparkFrom: 'pending',
    hideTrend: true,
  },
  {
    key: 'upcomingDue7Count',
    label: 'Upcoming Due (7 Days)',
    icon: Building2,
    iconColor: 'bg-pink-500',
    sparkColor: '#EC4899',
    changeLabel: 'Bookings',
    sparkFrom: 'pending',
    hideTrend: true,
  },
  {
    key: 'fullyPaidThisMonth',
    label: 'Fully Paid Bookings',
    icon: CheckCircle2,
    iconColor: 'bg-teal-500',
    sparkColor: '#14B8A6',
    changeLabel: 'This month',
    sparkFrom: 'paid',
    hideTrend: true,
  },
];

function resolveSparkline(item, kpis, weekTrend, monthTrend) {
  if (item.sparkFrom === 'week' && weekTrend.length) return weekTrend;
  if (item.sparkFrom === 'month' && monthTrend.length) return monthTrend;
  return buildSparkline(kpis[item.key]);
}

export default function PaymentKpiStrip({ kpis, weekTrend, monthTrend, loading }) {
  if (loading && !kpis) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-2xl bg-white border border-subtle animate-pulse h-[148px]" />
        ))}
      </div>
    );
  }

  if (!kpis) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {KPI_CONFIG.map((item, i) => {
        const value = kpis[item.key] ?? 0;
        const displayValue = item.format ? item.format(value) : String(value);
        const sparkData = resolveSparkline(item, kpis, weekTrend, monthTrend);
        const showTrend = !item.hideTrend && item.trendKey && item.prevKey;
        const change = showTrend
          ? pctChangeLabel(kpis[item.trendKey], kpis[item.prevKey])
          : undefined;
        const trendType = showTrend ? changeType(kpis[item.trendKey], kpis[item.prevKey]) : 'neutral';

        return (
          <KpiCard
            key={item.key}
            label={item.label}
            value={displayValue}
            change={change}
            changeType={trendType}
            changeLabel={showTrend ? item.changeLabel : undefined}
            subtitle={item.hideTrend ? item.changeLabel : undefined}
            icon={item.icon}
            iconColor={item.iconColor}
            sparkColor={item.sparkColor}
            sparkData={sparkData}
            index={i}
            compact
          />
        );
      })}
    </div>
  );
}
