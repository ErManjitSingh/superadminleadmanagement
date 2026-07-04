import {
  Car,
  CircleCheck,
  Clock,
  Hotel,
  Plane,
} from 'lucide-react';
import KpiCard from '../../dashboard/KpiCard';
import { buildSparkline } from '../bookings/bookingListUtils';

/** Matches Operations Command Center design — 5 status cards only. */
const KPI_CONFIG = [
  { key: 'pendingBookings', label: 'Pending Bookings', icon: Clock, iconColor: 'bg-orange-500', sparkColor: '#F97316' },
  { key: 'hotelPending', label: 'Hotel Pending', icon: Hotel, iconColor: 'bg-sky-500', sparkColor: '#0EA5E9' },
  { key: 'cabPending', label: 'Cab Pending', icon: Car, iconColor: 'bg-pink-500', sparkColor: '#EC4899' },
  { key: 'activeTrips', label: 'Active Trips', icon: Plane, iconColor: 'bg-emerald-500', sparkColor: '#22C55E' },
  { key: 'completedTrips', label: 'Completed Trips', icon: CircleCheck, iconColor: 'bg-slate-500', sparkColor: '#64748B' },
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
        const trend = kpiTrends?.[item.key] || { change: 'No change', changeType: 'neutral' };
        const sparkData = sparklines?.[item.key]?.length
          ? sparklines[item.key]
          : buildSparkline(kpis[item.key]);

        return (
          <KpiCard
            key={item.key}
            label={item.label}
            value={(kpis[item.key] ?? 0).toLocaleString('en-IN')}
            change={trend.change}
            changeType={trend.changeType || 'neutral'}
            changeLabel={trend.changeType === 'neutral' ? '' : 'vs last 7 days'}
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
