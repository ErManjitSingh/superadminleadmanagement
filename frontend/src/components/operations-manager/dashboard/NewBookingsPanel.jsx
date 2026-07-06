import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { formatINR, formatDate } from '../operationsUtils';
import { cn } from '../../../lib/utils';

const STATUS_STYLES = {
  pending: 'bg-amber-500/15 text-amber-700',
  partial: 'bg-sky-500/15 text-sky-700',
  paid: 'bg-emerald-500/15 text-emerald-700',
  overdue: 'bg-rose-500/15 text-rose-700',
};

export default function NewBookingsPanel({ bookings = [] }) {
  if (!bookings.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-500/10 via-indigo-500/5 to-transparent backdrop-blur-xl overflow-hidden shadow-lg"
    >
      <div className="px-5 py-4 border-b border-violet-200/40 flex items-center justify-between">
        <h3 className="font-bold text-content-primary flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-600" />
          NEW BOOKINGS
          <span className="ml-1 px-2 py-0.5 rounded-full bg-violet-600 text-white text-[10px] font-bold">{bookings.length}</span>
        </h3>
        <Link to="/operations-manager/bookings/pending" className="text-xs text-violet-600 hover:text-violet-500 flex items-center gap-1 font-semibold">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="divide-y divide-violet-100/50 dark:divide-violet-900/30">
        {bookings.map((b) => (
          <Link
            key={b._id}
            to={`/operations-manager/booking/${b._id}`}
            className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 hover:bg-violet-500/[0.06] transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-violet-600">{b.bookingNumber}</span>
                <span className={cn('text-[10px] font-bold uppercase px-2 py-0.5 rounded-full', STATUS_STYLES[b.paymentStatus] || STATUS_STYLES.pending)}>
                  {b.paymentStatus || 'pending'}
                </span>
                {b.priority === 'high' && (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700">Priority</span>
                )}
              </div>
              <p className="text-sm font-bold text-content-primary mt-1">{b.customerName}</p>
              <p className="text-xs text-content-muted">{b.destination} · {formatDate(b.travelDate)}</p>
            </div>
            <div className="flex sm:flex-col gap-3 sm:gap-1 sm:text-right text-sm shrink-0">
              <div>
                <p className="text-[10px] uppercase font-semibold text-content-muted">Package</p>
                <p className="font-bold tabular-nums">{formatINR(b.totalAmount)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-semibold text-emerald-600">Advance</p>
                <p className="font-bold text-emerald-600 tabular-nums">{formatINR(b.advanceReceived)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-semibold text-amber-600">Remaining</p>
                <p className="font-bold text-amber-600 tabular-nums">{formatINR(b.remainingBalance ?? b.pendingAmount)}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
