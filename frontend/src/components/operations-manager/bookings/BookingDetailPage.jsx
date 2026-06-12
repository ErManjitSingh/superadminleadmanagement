import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Hotel, Car, Ticket, Phone, Mail, CheckCircle2, Loader2,
  FileText, ListTodo, Calendar, Save, Plus, ExternalLink,
} from 'lucide-react';
import API from '../../../api/axios';
import PageHeader from '../../ui/PageHeader';
import { Button } from '../../ui/button';
import BookingStatusBadge from './BookingStatusBadge';
import { formatINR, formatDate, formatPax, formatTravelRange } from '../operationsUtils';
import { CONFIRMATION_CONFIG } from '../constants';
import { cn } from '../../../lib/utils';

const DOC_TYPES = [
  { value: 'customer_id', label: 'Customer ID' },
  { value: 'hotel_confirmation', label: 'Hotel Confirmation' },
  { value: 'flight_ticket', label: 'Flight Ticket' },
  { value: 'bus_ticket', label: 'Bus Ticket' },
  { value: 'travel_insurance', label: 'Travel Insurance' },
  { value: 'other', label: 'Other' },
];

const TASK_STATUS = {
  pending: 'bg-amber-500/15 text-amber-700',
  in_progress: 'bg-sky-500/15 text-sky-700',
  completed: 'bg-emerald-500/15 text-emerald-700',
};

export default function BookingDetailPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [itinerary, setItinerary] = useState([]);
  const [savingItinerary, setSavingItinerary] = useState(false);
  const [docForm, setDocForm] = useState({ type: 'hotel_confirmation', fileName: '', fileUrl: '' });
  const [addingDoc, setAddingDoc] = useState(false);
  const [itineraryPdfUrl, setItineraryPdfUrl] = useState(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const fetchBooking = () => {
    setLoading(true);
    API.get(`/operations-manager/bookings/${id}`)
      .then((r) => {
        setBooking(r.data);
        setItinerary(r.data.itinerary?.length ? r.data.itinerary : [{ day: 1, title: '', description: '' }]);
      })
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

  const updateStatus = async (status) => {
    setActionLoading(status);
    await API.put(`/operations-manager/bookings/${id}`, { status });
    fetchBooking();
    setActionLoading(null);
  };

  const saveItinerary = async () => {
    setSavingItinerary(true);
    await API.put(`/operations-manager/bookings/${id}`, { itinerary });
    fetchBooking();
    setSavingItinerary(false);
  };

  const addItineraryDay = () => {
    setItinerary((prev) => [...prev, { day: prev.length + 1, title: '', description: '' }]);
  };

  const updateItineraryDay = (index, field, value) => {
    setItinerary((prev) => prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)));
  };

  const addDocument = async (e) => {
    e.preventDefault();
    if (!docForm.fileUrl.trim()) return;
    setAddingDoc(true);
    await API.post(`/operations-manager/bookings/${id}/documents`, docForm);
    setDocForm({ type: 'hotel_confirmation', fileName: '', fileUrl: '' });
    fetchBooking();
    setAddingDoc(false);
  };

  const updateTaskStatus = async (taskId, status) => {
    await API.patch(`/operations-manager/tasks/${taskId}`, { status });
    fetchBooking();
  };

  const generateItineraryPdf = async () => {
    setGeneratingPdf(true);
    try {
      const r = await API.post(`/operations-manager/bookings/${id}/itinerary-pdf`);
      const url = r.data?.pdfUrl;
      setItineraryPdfUrl(url);
      if (url) window.open(url, '_blank');
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-32"><div className="w-9 h-9 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!booking) return <div className="text-center py-20 text-content-muted">Booking not found</div>;

  const amount = booking.totalAmount ?? booking.amount ?? 0;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-3">
        <Link to="/operations-manager/bookings/pending" className="p-2 rounded-xl border border-subtle hover:bg-surface-elevated">
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
                <h2 className="text-xl font-bold text-content-primary mt-2">{booking.packageName || booking.destination}</h2>
                <p className="text-sm text-content-muted">
                  Quote: {booking.quotationReference || booking.quoteNumber || '—'} · Executive: {booking.executiveName || '—'}
                </p>
                <p className="text-sm text-content-muted">Sales Manager: {booking.salesManagerName || '—'}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-teal-600 tabular-nums">{formatINR(amount)}</p>
                <p className="text-xs text-content-muted capitalize mt-1">Payment: {booking.paymentStatus || 'pending'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Travel Date', value: formatDate(booking.travelDate || booking.travelStart) },
                { label: 'Return Date', value: formatDate(booking.returnDate || booking.travelEnd) },
                { label: 'Passengers', value: formatPax(booking) },
                { label: 'Pending Amount', value: formatINR(booking.pendingAmount) },
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
            {(booking.hotels?.length ? booking.hotels : [{ hotelName: 'Not assigned', status: 'pending' }]).map((h, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-subtle bg-surface-elevated/30">
                <div>
                  <p className="font-semibold">{h.hotelName || h.name || 'Hotel'}</p>
                  <p className="text-xs text-content-muted">{formatDate(h.checkIn)} → {formatDate(h.checkOut)}</p>
                  {h.roomType && <p className="text-xs text-content-muted">{h.roomType}</p>}
                </div>
                <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-lg', CONFIRMATION_CONFIG[h.status]?.className)}>
                  {CONFIRMATION_CONFIG[h.status]?.label || h.status}
                </span>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-subtle bg-surface/80 p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2"><Car className="w-4 h-4 text-violet-600" /> Transport</h3>
            {(booking.transport?.length ? booking.transport : [{ vehicleType: 'Not assigned', status: 'pending' }]).map((t, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-subtle bg-surface-elevated/30">
                <div>
                  <p className="font-semibold capitalize">{(t.vehicleType || t.type || 'Vehicle').replace(/_/g, ' ')}</p>
                  <p className="text-xs text-content-muted">{t.pickupLocation || t.pickup || '—'} → {t.dropLocation || t.drop || '—'}</p>
                  {t.driverName && <p className="text-xs text-content-muted">{t.driverName} · {t.driverPhone}</p>}
                </div>
                <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-lg', CONFIRMATION_CONFIG[t.status]?.className)}>
                  {CONFIRMATION_CONFIG[t.status]?.label || t.status}
                </span>
              </div>
            ))}
          </div>

          {booking.activities?.length > 0 && (
            <div className="rounded-2xl border border-subtle bg-surface/80 p-6 space-y-3">
              <h3 className="font-bold">Activities</h3>
              {booking.activities.map((a, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-subtle">
                  <span className="font-medium">{a.name || a}</span>
                  <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-md capitalize', CONFIRMATION_CONFIG[a.status]?.className || 'bg-slate-500/15 text-slate-600')}>
                    {a.status || 'pending'}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-2xl border border-subtle bg-surface/80 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2"><Calendar className="w-4 h-4 text-teal-600" /> Day-wise Itinerary</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="rounded-lg gap-1" onClick={addItineraryDay}>
                  <Plus className="w-3.5 h-3.5" /> Add Day
                </Button>
                <Button variant="teal" size="sm" className="rounded-lg gap-1" disabled={savingItinerary} onClick={saveItinerary}>
                  {savingItinerary ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save
                </Button>
                <Button variant="outline" size="sm" className="rounded-lg gap-1" disabled={generatingPdf} onClick={generateItineraryPdf}>
                  {generatingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                  PDF
                </Button>
              </div>
            </div>
            {itineraryPdfUrl && (
              <a href={itineraryPdfUrl} target="_blank" rel="noreferrer" className="text-xs text-teal-600 hover:underline inline-flex items-center gap-1">
                <ExternalLink className="w-3 h-3" /> Open itinerary document
              </a>
            )}
            {itinerary.map((day, i) => (
              <div key={i} className="p-4 rounded-xl border border-subtle bg-surface-elevated/30 space-y-2">
                <p className="text-xs font-bold text-teal-600 uppercase">Day {day.day || i + 1}</p>
                <input
                  value={day.title || ''}
                  onChange={(e) => updateItineraryDay(i, 'title', e.target.value)}
                  placeholder="Day title"
                  className="input-premium w-full h-9 rounded-lg text-sm"
                />
                <textarea
                  value={day.description || ''}
                  onChange={(e) => updateItineraryDay(i, 'description', e.target.value)}
                  placeholder="Activities, meals, accommodation..."
                  rows={2}
                  className="input-premium w-full rounded-lg text-sm resize-none"
                />
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-subtle bg-surface/80 p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-600" /> Documents</h3>
            <form onSubmit={addDocument} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <select value={docForm.type} onChange={(e) => setDocForm((f) => ({ ...f, type: e.target.value }))} className="input-premium h-9 rounded-lg text-sm">
                {DOC_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
              <input value={docForm.fileName} onChange={(e) => setDocForm((f) => ({ ...f, fileName: e.target.value }))} placeholder="File name" className="input-premium h-9 rounded-lg text-sm" />
              <input value={docForm.fileUrl} onChange={(e) => setDocForm((f) => ({ ...f, fileUrl: e.target.value }))} placeholder="Document URL" required className="input-premium h-9 rounded-lg text-sm sm:col-span-2" />
              <Button type="submit" variant="teal" size="sm" className="rounded-lg h-9" disabled={addingDoc}>Add URL</Button>
            </form>
            <div className="space-y-2">
              {(booking.documents || []).map((d) => (
                <a key={d._id} href={d.fileUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded-xl border border-subtle hover:border-teal-500/30 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{d.fileName || d.type}</p>
                    <p className="text-xs text-content-muted capitalize">{d.type?.replace(/_/g, ' ')}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-teal-600" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-subtle bg-surface/80 p-5">
            <h3 className="font-bold mb-4">Customer</h3>
            <div className="space-y-3 text-sm">
              <p className="font-semibold text-lg">{booking.customerName}</p>
              <p className="flex items-center gap-2 text-content-secondary"><Phone className="w-4 h-4" />{booking.customerPhone || '—'}</p>
              <p className="flex items-center gap-2 text-content-secondary"><Mail className="w-4 h-4" />{booking.customerEmail || '—'}</p>
              <p className="text-xs text-content-muted pt-2">{formatTravelRange(booking)}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-subtle bg-surface/80 p-5">
            <h3 className="font-bold mb-3">Payment Tracking</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-content-muted">Advance</span><span className="font-bold">{formatINR(booking.advanceReceived)}</span></div>
              <div className="flex justify-between"><span className="text-content-muted">Pending</span><span className="font-bold text-amber-600">{formatINR(booking.pendingAmount)}</span></div>
              <div className="flex justify-between"><span className="text-content-muted">Total</span><span className="font-bold">{formatINR(amount)}</span></div>
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
              <Button variant="emerald" className="w-full rounded-xl gap-2" disabled={actionLoading === 'in_progress'} onClick={() => updateStatus('in_progress')}>
                <CheckCircle2 className="w-4 h-4" /> Mark Trip In Progress
              </Button>
            )}
            {booking.status === 'in_progress' && (
              <Button variant="secondary" className="w-full rounded-xl gap-2" disabled={actionLoading === 'completed'} onClick={() => updateStatus('completed')}>
                <CheckCircle2 className="w-4 h-4" /> Mark Completed
              </Button>
            )}
            <Link to="/operations-manager/vouchers">
              <Button variant="outline" className="w-full rounded-xl gap-2 mt-1">
                <Ticket className="w-4 h-4" /> Generate Voucher
              </Button>
            </Link>
          </div>

          {(booking.tasks?.length > 0) && (
            <div className="rounded-2xl border border-subtle bg-surface/80 p-5 space-y-3">
              <h3 className="font-bold flex items-center gap-2"><ListTodo className="w-4 h-4" /> Tasks</h3>
              {booking.tasks.map((t) => (
                <div key={t._id} className="p-3 rounded-xl border border-subtle text-sm">
                  <p className="font-medium">{t.title}</p>
                  <div className="flex items-center justify-between mt-2 gap-2">
                    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-md capitalize', TASK_STATUS[t.status])}>{t.status?.replace(/_/g, ' ')}</span>
                    {t.status !== 'completed' && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => updateTaskStatus(t._id, t.status === 'pending' ? 'in_progress' : 'completed')}>
                        {t.status === 'pending' ? 'Start' : 'Complete'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

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
