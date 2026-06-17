import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Car,
  ClipboardList,
  FileText,
  Plus,
  UserCog,
  Wrench,
} from 'lucide-react';
import OperationsDonutChart from '../dashboard/OperationsDonutChart';
import { cn } from '../../../lib/utils';
import { getVehicleThumbClass } from './transportListUtils';

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
  { label: 'Add New Vehicle', icon: Plus, to: '/operations-manager/transport' },
  { label: 'Manage Drivers', icon: UserCog, to: '/operations-manager/vendors' },
  { label: 'Vehicle Documents', icon: FileText, to: '/operations-manager/documents' },
  { label: 'Maintenance Schedule', icon: Wrench, to: '/operations-manager/transport' },
  { label: 'Transport Booking Report', icon: ClipboardList, to: '/operations-manager/reports' },
];

export default function TransportBottomPanels({ fleetOverview = [], mostUsed = [] }) {
  const chartData = (fleetOverview || [])
    .filter((s) => s.count > 0)
    .map((s) => ({
      name: s.label,
      value: s.count,
      color: s.color,
    }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">
      <PanelCard title="Fleet Status Overview" delay={0.05}>
        <OperationsDonutChart data={chartData} totalLabel="Vehicles" />
      </PanelCard>

      <PanelCard
        title="Most Used Vehicles (This Week)"
        footerLink="/operations-manager/transport"
        footerLabel="View Fleet Details"
        delay={0.1}
      >
        <div className="space-y-0">
          {(mostUsed || []).length === 0 && (
            <p className="text-sm text-content-muted py-6 text-center">No trip data yet</p>
          )}
          {(mostUsed || []).map((item, idx) => (
            <div
              key={`${item.name}-${idx}`}
              className="flex items-center gap-3 py-3 border-b border-subtle last:border-0"
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-xl bg-gradient-to-br shrink-0 flex items-center justify-center shadow-sm',
                  getVehicleThumbClass(item.name),
                )}
              >
                <Car className="w-4 h-4 text-white/90" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-content-primary truncate">{item.name}</p>
                <p className="text-xs text-content-muted">{item.vehicleType || 'SUV'}</p>
              </div>
              <span className="text-[11px] font-bold px-2 py-1 rounded-lg bg-blue-50 text-blue-700 shrink-0 tabular-nums">
                {item.trips} trip{item.trips === 1 ? '' : 's'}
              </span>
            </div>
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
