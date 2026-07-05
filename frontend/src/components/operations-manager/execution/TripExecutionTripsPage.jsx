import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plane, MapPin, Users, ChevronRight } from 'lucide-react';
import API from '../../../api/axios';
import PageHeader from '../../ui/PageHeader';
import BookingStatusBadge from '../bookings/BookingStatusBadge';
import { formatINR, formatTravelRange, formatPax } from '../operationsUtils';
import { cn } from '../../../lib/utils';

const MODE_CONFIG = {
  active: {
    title: 'Active Trips',
    description: 'Trips currently in progress',
    statuses: ['in_progress'],
  },
  upcoming: {
    title: 'Upcoming Trips',
    description: 'Confirmed trips starting soon',
    statuses: ['confirmed', 'booking_received', 'pending_verification'],
  },
  completed: {
    title: 'Completed Trips',
    description: 'Successfully completed journeys',
    statuses: ['completed'],
  },
};

export default function TripExecutionTripsPage({ mode = 'active' }) {
  const config = MODE_CONFIG[mode] || MODE_CONFIG.active;
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    API.get('/operations-manager/bookings', {
      params: { limit: 100 },
      skipSuccessToast: true,
    }).then((r) => {
      const list = r.data?.data || r.data || [];
      const filtered = list.filter((b) => config.statuses.includes(b.status));
      setBookings(filtered);
    }).finally(() => setLoading(false));
  }, [mode]);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title={config.title}
        description={config.description}
        breadcrumbs={['Operations', 'Trip Execution', config.title]}
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-9 h-9 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="rounded-3xl border border-dashed p-12 text-center text-content-muted">
          No trips in this category yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {bookings.map((b) => (
            <Link
              key={b._id}
              to={`/operations-manager/booking/${b._id}`}
              className={cn(
                'group rounded-3xl border border-subtle p-5 bg-gradient-to-br from-white/80 to-indigo-50/30',
                'dark:from-slate-900/80 dark:to-indigo-950/20 hover:border-indigo-400/40 hover:shadow-lg transition-all',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-indigo-600 font-bold">{b.bookingNumber}</p>
                  <h3 className="font-black text-lg mt-1 group-hover:text-indigo-600 transition-colors">{b.customerName}</h3>
                  <p className="text-sm text-content-muted flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5" /> {b.destination}
                  </p>
                </div>
                <BookingStatusBadge status={b.status} />
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-content-secondary">
                <span className="inline-flex items-center gap-1"><Plane className="w-3.5 h-3.5" />{formatTravelRange(b)}</span>
                <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" />{formatPax(b)}</span>
                <span className="font-bold text-indigo-600">{formatINR(b.totalAmount)}</span>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="capitalize text-content-muted">Voucher: {b.voucherStatus || 'pending'}</span>
                <span className="font-semibold text-indigo-600 inline-flex items-center gap-1">
                  Open execution <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
