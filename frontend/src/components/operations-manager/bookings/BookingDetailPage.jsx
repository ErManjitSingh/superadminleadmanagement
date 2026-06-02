import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Hotel, Car, Ticket, Phone, Mail, CheckCircle2, Loader2 } from 'lucide-react';
import API from '../../../api/axios';
import PageHeader from '../../ui/PageHeader';
import { Button } from '../../ui/button';
import BookingStatusBadge from './BookingStatusBadge';
import { formatINR, formatDate } from '../operationsUtils';
import { CONFIRMATION_CONFIG } from '../constants';
import { cn } from '../../../lib/utils';

export default function BookingDetailPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchBooking = () => {
    setLoading(true);
    API.get(`/operations-manager/bookings/${id}`)
      .then((r) => setBooking(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBooking(); }, [id]);

  const confirmHotel = async () => {
    setActionLoading('hotel');
    await API.post(`/operations-manager/bookings/${id}/confirm-hotel`);
    fetchBooking();
    setActionLoading(null);
  };

  const confirmCab = async () => {
    setActionLoading('cab');
    await API.post(`/operations-manager/bookings/${id}/confirm-cab`);
    fetchBooking();
    setActionLoading(null);
  };

  const markActive = async () => {
    setActionLoading('active');
    await API.put(`/operations-manager/bookings/${id}`, { status: 'active' });
    fetchBooking();
    setActionLoading(null);
  };

  const markCompleted = async () => {
    setActionLoading('completed');
    await API.put(`/operations-manager/bookings/${id}`, { status: 'completed' });
    fetchBooking();
    setActionLoading(null);
  };

  if (loading) {
    return <div className="flex justify-center py-32"><div className="w-9 h-9 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!booking) return <div className="text-center py-20 text-content-muted">Booking not found</div>;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-3">
        <Link to={`/operations-manager/bookings/${booking.status}`} className="p-2 rounded-xl border border-subtle hover:bg-surface-elevated">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader
          title={booking.bookingNumber}
          description={`${booking.customerName} · ${booking.destination}`}
          breadcrumbs={['Operations', 'Bookings', booking.bookingNumber]}
        />
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-subtle bg-surface/80 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div>
                <BookingStatusBadge status={booking.status} />
                <h2 className="text-xl font-bold text-content-primary mt-2">{booking.packageName}</h2>
                <p className="text-sm text-content-muted">Quote: {booking.quoteNumber} · Executive: {booking.executiveName}</p>
              </div>
              <p className="text-2xl font-black text-teal-600 tabular-nums">{formatINR(booking.amount)}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Travel Start', value: formatDate(booking.travelStart) },
                { label: 'Travel End', value: formatDate(booking.travelEnd) },
                { label: 'Passengers', value: booking.pax },
                { label: 'Destination', value: booking.destination },
              ].map(({ label, value }) => (
                <div key={label} className="p-3 rounded-xl bg-surface-elevated/50 border border-subtle">
                  <p className="text-[10px] font-semibold uppercase text-content-muted">{label}</p>
                  <p className="text-sm font-bold text-content-primary mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-subtle bg-surface/80 p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2"><Hotel className="w-4 h-4 text-teal-600" /> Hotel Details</h3>
            {booking.hotels?.map((h, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-subtle bg-surface-elevated/30">
                <div>
                  <p className="font-semibold">{h.name}</p>
                  <p className="text-xs text-content-muted">{formatDate(h.checkIn)} → {formatDate(h.checkOut)}</p>
                </div>
                <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-lg', CONFIRMATION_CONFIG[h.status]?.className)}>{CONFIRMATION_CONFIG[h.status]?.label}</span>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-subtle bg-surface/80 p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2"><Car className="w-4 h-4 text-violet-600" /> Transport</h3>
            {booking.transport?.map((t, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-subtle bg-surface-elevated/30">
                <div>
                  <p className="font-semibold">{t.type}</p>
                  <p className="text-xs text-content-muted">{t.pickup} → {t.drop}</p>
                </div>
                <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-lg', CONFIRMATION_CONFIG[t.status]?.className)}>{CONFIRMATION_CONFIG[t.status]?.label}</span>
              </div>
            ))}
          </div>

          {booking.activities?.length > 0 && (
            <div className="rounded-2xl border border-subtle bg-surface/80 p-6">
              <h3 className="font-bold mb-3">Activities</h3>
              <div className="flex flex-wrap gap-2">
                {booking.activities.map((a) => (
                  <span key={a} className="px-3 py-1.5 rounded-lg bg-teal-500/10 text-teal-700 text-sm font-medium">{a}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-subtle bg-surface/80 p-5">
            <h3 className="font-bold mb-4">Customer</h3>
            <div className="space-y-3 text-sm">
              <p className="font-semibold text-lg">{booking.customerName}</p>
              <p className="flex items-center gap-2 text-content-secondary"><Phone className="w-4 h-4" />{booking.customerPhone}</p>
              <p className="flex items-center gap-2 text-content-secondary"><Mail className="w-4 h-4" />{booking.customerEmail}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-subtle bg-surface/80 p-5 space-y-3">
            <h3 className="font-bold mb-2">Operations Actions</h3>
            {booking.hotelConfirmation === 'pending' && (
              <Button variant="teal" className="w-full rounded-xl gap-2" disabled={actionLoading === 'hotel'} onClick={confirmHotel}>
                {actionLoading === 'hotel' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Hotel className="w-4 h-4" />}
                Confirm Hotel
              </Button>
            )}
            {booking.cabConfirmation === 'pending' && (
              <Button variant="violet" className="w-full rounded-xl gap-2" disabled={actionLoading === 'cab'} onClick={confirmCab}>
                {actionLoading === 'cab' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Car className="w-4 h-4" />}
                Confirm Cab
              </Button>
            )}
            {booking.status === 'confirmed' && (
              <Button variant="emerald" className="w-full rounded-xl gap-2" disabled={actionLoading === 'active'} onClick={markActive}>
                <CheckCircle2 className="w-4 h-4" /> Mark Trip Active
              </Button>
            )}
            {booking.status === 'active' && (
              <Button variant="secondary" className="w-full rounded-xl gap-2" disabled={actionLoading === 'completed'} onClick={markCompleted}>
                <CheckCircle2 className="w-4 h-4" /> Mark Completed
              </Button>
            )}
            <Link to="/operations-manager/vouchers">
              <Button variant="outline" className="w-full rounded-xl gap-2 mt-1">
                <Ticket className="w-4 h-4" /> Generate Voucher
              </Button>
            </Link>
          </div>

          {booking.notes && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-800 dark:text-amber-300">
              <p className="font-semibold mb-1">Notes</p>
              {booking.notes}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
