import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plane, Clock, CheckCircle2, XCircle } from 'lucide-react';
import API from '../../../api/axios';
import PageHeader from '../../ui/PageHeader';
import BookingStatusBadge from '../bookings/BookingStatusBadge';
import { formatDate, formatTravelRange } from '../operationsUtils';

const TABS = [
  { key: 'upcoming', label: 'Upcoming', icon: Clock, color: 'text-sky-600' },
  { key: 'ongoing', label: 'Ongoing', icon: Plane, color: 'text-emerald-600' },
  { key: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-slate-600' },
  { key: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'text-rose-600' },
];

export default function TripTrackerPage() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('upcoming');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    API.get('/operations-manager/trip-tracker')
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  const trips = data?.[tab] || [];

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Trip Tracker"
        description="Upcoming, ongoing, and completed trips with countdown"
        breadcrumbs={['Operations', 'Trip Tracker']}
      />

      <div className="flex flex-wrap gap-2">
        {TABS.map(({ key, label, icon: Icon, color }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              tab === key ? 'bg-teal-600 text-white border-teal-600' : 'border-subtle text-content-muted hover:bg-surface-elevated'
            }`}
          >
            <Icon className={`w-4 h-4 ${tab === key ? 'text-white' : color}`} />
            {label}
            <span className="text-xs opacity-80">({data?.[key]?.length ?? 0})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-24 text-center text-content-muted animate-pulse">Loading trips…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {trips.length === 0 && (
            <p className="col-span-full text-center py-16 text-content-muted">No trips in this category</p>
          )}
          {trips.map((trip, i) => (
            <motion.div
              key={trip._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl border border-subtle bg-surface/80 p-5 hover:border-teal-500/20 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <Link to={`/operations-manager/booking/${trip._id}`} className="font-mono text-sm font-bold text-teal-600 hover:underline">
                  {trip.bookingNumber}
                </Link>
                <BookingStatusBadge status={trip.status} />
              </div>
              <h3 className="font-bold text-content-primary">{trip.customerName}</h3>
              <p className="text-sm text-content-secondary mt-0.5">{trip.destination}</p>
              <p className="text-xs text-content-muted mt-2">{formatTravelRange(trip)}</p>
              {trip.tripLabel && tab === 'upcoming' && (
                <div className="mt-3 px-3 py-2 rounded-lg bg-sky-500/10 text-sky-700 text-xs font-semibold">
                  {trip.tripLabel}
                </div>
              )}
              {tab === 'ongoing' && trip.travelDate && (
                <p className="mt-3 text-xs font-semibold text-emerald-600">Started {formatDate(trip.travelDate)}</p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
