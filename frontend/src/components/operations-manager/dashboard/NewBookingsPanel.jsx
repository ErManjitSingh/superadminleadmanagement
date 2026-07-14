import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Eye } from 'lucide-react';
import { formatINR, formatDate } from '../operationsUtils';
import { cn } from '../../../lib/utils';

const AVATAR_COLORS = [
  'bg-violet-500',
  'bg-sky-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-indigo-500',
];

const PAYMENT_STYLES = {
  pending: 'bg-amber-100 text-amber-700',
  partial: 'bg-sky-100 text-sky-700',
  paid: 'bg-emerald-100 text-emerald-700',
  overdue: 'bg-rose-100 text-rose-700',
};

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';
}

function nightsLabel(booking) {
  const start = booking.travelDate ? new Date(booking.travelDate) : null;
  const end = booking.returnDate ? new Date(booking.returnDate) : null;
  if (!start || !end || Number.isNaN(start) || Number.isNaN(end)) return null;
  const nights = Math.max(1, Math.round((end - start) / 86400000));
  return `${nights}N / ${nights + 1}D`;
}

export default function NewBookingsPanel({ bookings = [] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-subtle bg-white shadow-sm overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-subtle flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-content-primary tracking-tight">New Bookings</h3>
          <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[11px] font-bold">
            {bookings.length}
          </span>
        </div>
        <Link
          to="/operations-manager/bookings/pending"
          className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1 font-semibold"
        >
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {!bookings.length ? (
        <div className="px-5 py-12 text-center text-sm text-content-muted">No new bookings right now</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-content-muted">
                <th className="px-4 py-3 font-semibold">Booking ID</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Destination</th>
                <th className="px-4 py-3 font-semibold">Package</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {bookings.map((b, idx) => {
                const remaining = b.remainingBalance ?? Math.max(0, (b.totalAmount || 0) - (b.advanceReceived || b.totalPaid || 0));
                const duration = nightsLabel(b);
                return (
                  <tr key={b._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-mono text-xs font-bold text-violet-600">{b.bookingNumber}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={cn(
                            'w-9 h-9 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0',
                            AVATAR_COLORS[idx % AVATAR_COLORS.length]
                          )}
                        >
                          {initials(b.customerName)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-content-primary truncate">{b.customerName || '—'}</p>
                          <p className="text-xs text-content-muted truncate">{b.customerPhone || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-semibold text-content-primary">{b.destination || '—'}</p>
                      <p className="text-xs text-content-muted">{formatDate(b.travelDate)}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-medium text-content-primary truncate max-w-[140px]">
                        {b.packageName || 'Custom Package'}
                      </p>
                      {duration && <p className="text-xs text-content-muted">{duration}</p>}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-bold text-content-primary tabular-nums">{formatINR(b.totalAmount)}</p>
                      <p className="text-[11px] mt-0.5">
                        <span className="text-emerald-600 font-semibold">Adv {formatINR(b.advanceReceived || b.totalPaid)}</span>
                        <span className="text-content-muted mx-1">·</span>
                        <span className="text-amber-600 font-semibold">Rem {formatINR(remaining)}</span>
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        <span
                          className={cn(
                            'text-[10px] font-bold uppercase px-2 py-0.5 rounded-full',
                            PAYMENT_STYLES[b.paymentStatus] || PAYMENT_STYLES.pending
                          )}
                        >
                          {b.paymentStatus || 'pending'}
                        </span>
                        {b.priority === 'high' && (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                            Priority
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        to={`/operations-manager/booking/${b._id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-subtle text-xs font-semibold text-content-secondary hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
