import { motion } from 'framer-motion';
import { BadgeCheck, Calendar, MoreHorizontal } from 'lucide-react';
import { formatDateRangeLabel } from '../bookings/bookingListUtils';

export default function OperationsDashboardHeader({ dateFrom, dateTo }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-1"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <BadgeCheck className="w-7 h-7 text-blue-500 shrink-0" strokeWidth={2.25} />
            <h1 className="text-2xl sm:text-[26px] font-bold text-content-primary tracking-tight">
              Operations Command Center
            </h1>
          </div>
          <p className="text-sm text-content-secondary">
            Real-time overview of operations, bookings &amp; trip execution
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-subtle bg-white text-sm font-medium text-content-primary hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Calendar className="w-4 h-4 text-content-muted" />
            {formatDateRangeLabel(dateFrom, dateTo)}
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
    </motion.div>
  );
}
