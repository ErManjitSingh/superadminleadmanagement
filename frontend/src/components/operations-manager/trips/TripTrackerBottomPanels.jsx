import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CalendarDays,
  FileText,
  Plus,
  Truck,
  UserPlus,
} from 'lucide-react';
import OperationsDonutChart from '../dashboard/OperationsDonutChart';
import { formatTripDateShort } from './tripTrackerUtils';

function PanelCard({ title, children, footerLink, footerLabel, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl border border-subtle bg-white shadow-sm overflow-hidden h-full flex flex-col"
    >
      <div className="px-5 py-4 border-b border-subtle">
        <h3 className="font-bold text-content-primary">{title}</h3>
      </div>
      <div className="p-5 flex-1">{children}</div>
      {footerLink && (
        <div className="px-5 py-3 border-t border-subtle bg-slate-50/50">
          <Link
            to={footerLink}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
          >
            {footerLabel}
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </motion.div>
  );
}

const QUICK_ACTIONS = [
  { label: 'Create New Trip', icon: Plus, to: '/operations-manager/bookings/pending' },
  { label: 'Assign Task', icon: UserPlus, to: '/operations-manager/tasks' },
  { label: 'Vendor Follow-up', icon: Truck, to: '/operations-manager/vendors' },
  { label: 'Trip Report', icon: FileText, to: '/operations-manager/reports' },
  { label: 'View Calendar', icon: CalendarDays, to: '/operations-manager/calendar' },
];

export default function TripTrackerBottomPanels({ statusOverview, upcomingDepartures }) {
  const chartData = (statusOverview || [])
    .filter((s) => s.count > 0)
    .map((s) => ({
      name: s.label,
      value: s.count,
      color: s.color,
    }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">
      <PanelCard title="Trip Status Overview" delay={0.05}>
        <OperationsDonutChart data={chartData} totalLabel="Trips" />
      </PanelCard>

      <PanelCard
        title="Upcoming Departures (Next 7 Days)"
        footerLink="/operations-manager/trip-tracker"
        footerLabel="View All Upcoming Trips"
        delay={0.1}
      >
        <div className="space-y-0">
          {(upcomingDepartures || []).length === 0 && (
            <p className="text-sm text-content-muted py-6 text-center">No departures in the next 7 days</p>
          )}
          {(upcomingDepartures || []).map((item) => (
            <Link
              key={item._id}
              to={`/operations-manager/booking/${item._id}`}
              className="flex items-center gap-3 py-3 border-b border-subtle last:border-0 hover:bg-slate-50/80 -mx-2 px-2 rounded-lg transition-colors"
            >
              <span className="text-xs font-bold text-blue-600 w-12 shrink-0 tabular-nums">
                {formatTripDateShort(item.travelDate)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-content-primary truncate">{item.customerName}</p>
                <p className="text-xs text-content-muted truncate">{item.destination}</p>
              </div>
              <span className="text-[11px] font-bold px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
                {item.daysLeftLabel}
              </span>
            </Link>
          ))}
        </div>
      </PanelCard>

      <PanelCard title="Quick Actions" delay={0.15}>
        <div className="space-y-1">
          {QUICK_ACTIONS.map(({ label, icon: Icon, to }) => (
            <Link
              key={label}
              to={to}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-content-secondary hover:bg-slate-50 hover:text-blue-600 transition-colors"
            >
              <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-content-muted">
                <Icon className="w-4 h-4" />
              </span>
              {label}
            </Link>
          ))}
        </div>
      </PanelCard>
    </div>
  );
}
