import {
  ClipboardList,
  CircleCheck,
  Clock,
  Plane,
  IndianRupee,
} from 'lucide-react';
import KpiCard from '../../dashboard/KpiCard';
import { buildSparkline } from '../bookings/bookingListUtils';

function formatRevenue(amount) {
  const n = Number(amount) || 0;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

/** Matches Operations Command Center design — Total / Confirmed / Pending / On Trip / Revenue */
const KPI_CONFIG = [
  {
    key: 'totalBookings',
    label: 'Total Bookings',
    icon: ClipboardList,
    iconColor: 'bg-blue-500',
    sparkColor: '#3B82F6',
    format: (v) => (v ?? 0).toLocaleString('en-IN'),
  },
  {
    key: 'confirmedBookings',
    label: 'Confirmed',
    icon: CircleCheck,
    iconColor: 'bg-emerald-500',
    sparkColor: '#22C55E',
    format: (v) => (v ?? 0).toLocaleString('en-IN'),
  },
  {
    key: 'pendingBookings',
    label: 'Pending',
    icon: Clock,
    iconColor: 'bg-orange-500',
    sparkColor: '#F97316',
    format: (v) => (v ?? 0).toLocaleString('en-IN'),
  },
  {
    key: 'activeTrips',
    label: 'On Trip',
    icon: Plane,
    iconColor: 'bg-violet-500',
    sparkColor: '#8B5CF6',
    format: (v) => (v ?? 0).toLocaleString('en-IN'),
    trendKey: 'onTrip',
    sparkKey: 'onTrip',
  },
  {
    key: 'totalRevenue',
    label: 'Revenue',
    icon: IndianRupee,
    iconColor: 'bg-sky-500',
    sparkColor: '#0EA5E9',
    format: formatRevenue,
  },
];

export default function OperationsKpiCards({ kpis, kpiTrends, sparklines, loading }) {
  if (loading && !kpis) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-2xl bg-white border border-subtle animate-pulse h-[148px]" />
        ))}
      </div>
    );
  }

  if (!kpis) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
      {KPI_CONFIG.map((item, i) => {
        const trendKey = item.trendKey || item.key;
        const sparkKey = item.sparkKey || item.key;
        const trend = kpiTrends?.[trendKey] || { change: 'No change', changeType: 'neutral' };
        const sparkData = sparklines?.[sparkKey]?.length
          ? sparklines[sparkKey]
          : buildSparkline(kpis[item.key]);

        return (
          <KpiCard
            key={item.key}
            label={item.label}
            value={item.format(kpis[item.key])}
            change={trend.change}
            changeType={trend.changeType || 'neutral'}
            changeLabel={trend.changeType === 'neutral' ? '' : 'vs last week'}
            icon={item.icon}
            iconColor={item.iconColor}
            sparkColor={item.sparkColor}
            sparkData={sparkData}
            index={i}
          />
        );
      })}
    </div>
  );
}
