import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Eye } from 'lucide-react';
import API from '../../../api/axios';
import PageHeader from '../../ui/PageHeader';
import { Button } from '../../ui/button';
import BookingStatusBadge from './BookingStatusBadge';
import { formatINR, formatDate, formatPax } from '../operationsUtils';
import { CONFIRMATION_CONFIG } from '../constants';
import { cn } from '../../../lib/utils';

const PAGE_META = {
  pending: { title: 'Pending Bookings', desc: 'New confirmed sales awaiting operations setup' },
  confirmed: { title: 'Confirmed Bookings', desc: 'Hotels & transport confirmed — ready for departure' },
  active: { title: 'Active Trips', desc: 'Guests currently on trip — monitor execution' },
  completed: { title: 'Completed Trips', desc: 'Successfully fulfilled travel bookings' },
};

export default function BookingsListPage() {
  const { status } = useParams();
  const meta = PAGE_META[status] || PAGE_META.pending;
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(() => {
    setLoading(true);
    API.get('/operations-manager/bookings', { params: { status, search: search || undefined, limit: 50 } })
      .then((r) => setBookings(r.data?.data || r.data || []))
      .finally(() => setLoading(false));
  }, [status, search]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title={meta.title}
        description={meta.desc}
        breadcrumbs={['Operations', 'Bookings', meta.title]}
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search bookings..."
          className="input-premium w-full h-10 pl-10 rounded-xl text-sm"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-subtle bg-surface/80 backdrop-blur-xl overflow-hidden shadow-sm"
      >
        {loading ? (
          <div className="p-16 text-center text-content-muted animate-pulse">Loading bookings...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-subtle bg-surface-elevated/50">
                  {['Booking #', 'Customer', 'Destination', 'Package', 'Travel', 'Pax', 'Amount', 'Hotel', 'Cab', 'Status', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold uppercase text-content-muted whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {bookings.map((b) => (
                  <tr key={b._id} className="hover:bg-teal-500/[0.03] group">
                    <td className="px-4 py-3.5 font-mono text-sm font-bold text-teal-600">{b.bookingNumber}</td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-medium">{b.customerName}</p>
                      <p className="text-xs text-content-muted">{b.customerPhone}</p>
                    </td>
                    <td className="px-4 py-3.5 text-sm">{b.destination}</td>
                    <td className="px-4 py-3.5 text-sm text-content-secondary max-w-[160px] truncate">{b.packageName}</td>
                    <td className="px-4 py-3.5 text-xs text-content-muted whitespace-nowrap">{formatDate(b.travelDate || b.travelStart)}</td>
                    <td className="px-4 py-3.5 text-sm text-center">{formatPax(b)}</td>
                    <td className="px-4 py-3.5 text-sm font-bold tabular-nums">{formatINR(b.totalAmount ?? b.amount)}</td>
                    <td className="px-4 py-3.5">
                      <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-md', CONFIRMATION_CONFIG[b.hotelConfirmation]?.className)}>{CONFIRMATION_CONFIG[b.hotelConfirmation]?.label}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-md', CONFIRMATION_CONFIG[b.cabConfirmation]?.className)}>{CONFIRMATION_CONFIG[b.cabConfirmation]?.label}</span>
                    </td>
                    <td className="px-4 py-3.5"><BookingStatusBadge status={b.status} /></td>
                    <td className="px-4 py-3.5">
                      <Link to={`/operations-manager/booking/${b._id}`}>
                        <Button variant="ghost" size="sm" className="h-8 gap-1 opacity-70 group-hover:opacity-100">
                          <Eye className="w-3.5 h-3.5" /> View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
