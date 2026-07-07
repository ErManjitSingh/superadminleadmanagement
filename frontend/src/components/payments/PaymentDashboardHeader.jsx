import { motion } from 'framer-motion';
import { BarChart3, Calendar, SlidersHorizontal } from 'lucide-react';
import { formatDateRangeLabel } from '../operations-manager/bookings/bookingListUtils';

export default function PaymentDashboardHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-1"
    >
      <nav className="text-xs text-content-muted mb-2 flex items-center gap-1.5">
        <span>Payments</span>
        <span>/</span>
        <span className="text-content-secondary font-medium">Dashboard</span>
      </nav>

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <BarChart3 className="w-7 h-7 text-violet-500 shrink-0" strokeWidth={2.25} />
            <h1 className="text-2xl sm:text-[26px] font-bold text-content-primary tracking-tight">
              Payments Dashboard
            </h1>
          </div>
          <p className="text-sm text-content-secondary">
            Real-time overview of your collections, dues, refunds &amp; more
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-subtle bg-white dark:bg-slate-900 text-sm font-medium text-content-primary hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Calendar className="w-4 h-4 text-content-muted" />
            {formatDateRangeLabel()}
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-subtle bg-white dark:bg-slate-900 text-sm font-medium text-content-primary hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <SlidersHorizontal className="w-4 h-4 text-content-muted" />
            Filter
          </button>
        </div>
      </div>
    </motion.div>
  );
}
