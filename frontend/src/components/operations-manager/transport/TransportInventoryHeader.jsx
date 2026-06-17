import { motion } from 'framer-motion';
import { BadgeCheck, Calendar, Car, MoreHorizontal } from 'lucide-react';
import { formatDateRangeLabel } from '../bookings/bookingListUtils';

export default function TransportInventoryHeader({ total }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-5"
    >
      <nav className="text-xs text-content-muted mb-2 flex items-center gap-1.5">
        <span>Operations</span>
        <span>/</span>
        <span className="text-content-secondary font-medium">Transport</span>
      </nav>

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <BadgeCheck className="w-7 h-7 text-blue-500 shrink-0" strokeWidth={2.25} />
            <h1 className="text-2xl sm:text-[26px] font-bold text-content-primary tracking-tight">
              Transport Management
            </h1>
            {total != null && (
              <span className="px-2.5 py-0.5 rounded-lg text-sm font-bold metric-tabular bg-sky-100 text-sky-700">
                {total.toLocaleString('en-IN')}
              </span>
            )}
          </div>
          <p className="text-sm text-content-secondary">
            Cab fleet and flight inventory for trip execution
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-subtle bg-white text-sm font-medium text-content-primary hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Calendar className="w-4 h-4 text-content-muted" />
            {formatDateRangeLabel()}
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-subtle bg-white text-content-muted hover:bg-slate-50 transition-colors shadow-sm"
            aria-label="More options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 hidden sm:flex items-center gap-2 text-xs text-content-muted">
        <Car className="w-3.5 h-3.5" />
        <span>Fleet inventory synced with booking transport assignments</span>
      </div>
    </motion.div>
  );
}
