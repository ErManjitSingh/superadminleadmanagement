import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Hotel, Car, Headphones, ClipboardList } from 'lucide-react';
import BookingStatusBadge from '../bookings/BookingStatusBadge';
import OperationsDataTable from '../ui/OperationsDataTable';
import { CONFIRMATION_CONFIG } from '../constants';
import { formatDate } from '../operationsUtils';
import { cn } from '../../../lib/utils';

function ConfirmBadge({ status }) {
  const cfg = CONFIRMATION_CONFIG[status] || CONFIRMATION_CONFIG.pending;
  return <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-md', cfg.className)}>{cfg.label}</span>;
}

export default function OperationsDashboardPanels({ data }) {
  const navigate = useNavigate();

  const recentColumns = useMemo(() => [
    {
      key: 'bookingNumber',
      header: 'Booking #',
      render: (b) => (
        <Link to={`/operations-manager/booking/${b._id}`} className="font-mono text-sm font-bold text-violet-600 hover:underline" onClick={(e) => e.stopPropagation()}>
          {b.bookingNumber}
        </Link>
      ),
    },
    { key: 'customerName', header: 'Customer' },
    { key: 'destination', header: 'Destination', className: 'text-content-secondary' },
    {
      key: 'travel',
      header: 'Travel Dates',
      className: 'text-xs text-content-muted whitespace-nowrap',
      render: (b) => `${formatDate(b.travelDate || b.travelStart)} → ${formatDate(b.returnDate || b.travelEnd)}`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (b) => <BookingStatusBadge status={b.status} />,
    },
  ], []);

  if (!data) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-subtle bg-surface/80 backdrop-blur-xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-subtle flex items-center justify-between">
          <h3 className="font-bold text-content-primary">Pending Confirmations</h3>
          <Link to="/operations-manager/bookings/pending" className="text-xs text-violet-600 hover:text-violet-500 flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="divide-y divide-subtle">
          {(data.pendingConfirmations || []).map((b) => (
            <Link
              key={b._id}
              to={`/operations-manager/booking/${b._id}`}
              className="flex items-center gap-4 px-5 py-3.5 hover:bg-violet-500/[0.04] transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-mono text-xs text-violet-600 font-bold">{b.bookingNumber}</p>
                <p className="text-sm font-medium text-content-primary truncate">{b.customerName} · {b.destination}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <span className="flex items-center gap-1 text-[10px] text-content-muted"><Hotel className="w-3 h-3" /><ConfirmBadge status={b.hotelConfirmation} /></span>
                <span className="flex items-center gap-1 text-[10px] text-content-muted"><Car className="w-3 h-3" /><ConfirmBadge status={b.cabConfirmation} /></span>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border border-subtle bg-surface/80 backdrop-blur-xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-subtle flex items-center justify-between">
          <h3 className="font-bold text-content-primary flex items-center gap-2">
            <Headphones className="w-4 h-4 text-rose-500" /> Open Support Tickets
          </h3>
          <Link to="/operations-manager/support" className="text-xs text-violet-600 hover:text-violet-500 flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="divide-y divide-subtle">
          {(data.openTickets || []).map((t) => (
            <div key={t._id} className="px-5 py-3.5">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <p className="font-mono text-xs text-content-muted">{t.ticketNumber}</p>
                <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-md capitalize', t.priority === 'high' ? 'bg-rose-500/15 text-rose-700' : 'bg-amber-500/15 text-amber-700')}>{t.priority}</span>
              </div>
              <p className="text-sm font-medium text-content-primary">{t.subject}</p>
              <p className="text-xs text-content-muted mt-0.5">{t.customerName} · {t.category}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="lg:col-span-2 space-y-3"
      >
        <div className="flex items-center justify-between px-1">
          <h3 className="font-bold text-content-primary">Recent Bookings</h3>
          <Link to="/operations-manager/bookings/pending" className="text-xs text-violet-600 hover:text-violet-500 flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <OperationsDataTable
          columns={recentColumns}
          data={data.recentBookings || []}
          compact
          emptyIcon={ClipboardList}
          emptyTitle="No recent bookings"
          onRowClick={(b) => navigate(`/operations-manager/booking/${b._id}`)}
        />
      </motion.div>
    </div>
  );
}
