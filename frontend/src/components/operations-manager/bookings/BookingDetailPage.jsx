import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Ticket, Phone, Mail, CheckCircle2, Loader2,
  FileText, ListTodo, MapPin, Users, Wallet, ExternalLink,
} from 'lucide-react';
import API from '../../../api/axios';
import PageHeader from '../../ui/PageHeader';
import { Button } from '../../ui/button';
import BookingStatusBadge from './BookingStatusBadge';
import { formatINR, formatDate, formatPax, formatTravelRange } from '../operationsUtils';
import { cn } from '../../../lib/utils';
import {
  QuotationSyncBanner,
  BookingHotelsEditor,
  BookingTransportEditor,
  BookingItineraryTimeline,
} from './BookingFulfillmentSections';

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

function applyBookingState(data, setters) {
  const {
    setBooking, setItinerary, setHotels, setTransport,
  } = setters;
  setBooking(data);
  setItinerary(data.itinerary?.length ? data.itinerary : [{ day: 1, title: '', description: '' }]);
  setHotels(data.hotels?.length ? data.hotels : []);
  setTransport(data.transport?.length ? data.transport : []);
}

export default function BookingDetailPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [itinerary, setItinerary] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [transport, setTransport] = useState([]);
  const [savingItinerary, setSavingItinerary] = useState(false);
  const [savingHotels, setSavingHotels] = useState(false);
  const [savingTransport, setSavingTransport] = useState(false);
  const [syncingQuote, setSyncingQuote] = useState(false);
  const [docForm, setDocForm] = useState({ type: 'hotel_confirmation', fileName: '', fileUrl: '' });
  const [addingDoc, setAddingDoc] = useState(false);
  const [itineraryPdfUrl, setItineraryPdfUrl] = useState(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [catalogHotels, setCatalogHotels] = useState([]);
  const [catalogCabs, setCatalogCabs] = useState([]);

  const setters = { setBooking, setItinerary, setHotels, setTransport };

  const fetchBooking = () => {
    setLoading(true);
    API.get(`/operations-manager/bookings/${id}`)
      .then((r) => applyBookingState(r.data, setters))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBooking(); }, [id]);

  useEffect(() => {
    Promise.all([
      API.get('/operations-manager/hotels'),
      API.get('/operations-manager/transport'),
    ]).then(([hotelsRes, transportRes]) => {
      setCatalogHotels(hotelsRes.data || []);
      setCatalogCabs(transportRes.data?.cabs || []);
    }).catch(() => {});
  }, []);

  const syncFromQuotation = async () => {
    setSyncingQuote(true);
    try {
      const r = await API.post(`/operations-manager/bookings/${id}/sync-quotation`, { force: true });
      applyBookingState(r.data, setters);
    } finally {
      setSyncingQuote(false);
    }
  };

  const saveItinerary = async () => {
    setSavingItinerary(true);
    await API.put(`/operations-manager/bookings/${id}`, { itinerary });
    fetchBooking();
    setSavingItinerary(false);
  };

  const saveHotels = async () => {
    setSavingHotels(true);
    await API.put(`/operations-manager/bookings/${id}`, { hotels });
    fetchBooking();
    setSavingHotels(false);
  };

  const saveTransport = async () => {
    setSavingTransport(true);
    await API.put(`/operations-manager/bookings/${id}`, { transport });
    fetchBooking();
    setSavingTransport(false);
  };

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
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-content-muted">Loading trip fulfillment...</p>
      </div>
    );
  }

  if (!booking) return <div className="text-center py-20 text-content-muted">Booking not found</div>;

  const amount = booking.totalAmount ?? booking.amount ?? 0;
  const quoteMeta = booking.quotationMeta || booking.quotationPreview?.meta;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-3">
        <Link to="/operations-manager/bookings/pending" className="p-2.5 rounded-xl border border-subtle hover:bg-surface-elevated transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader
          title={booking.bookingNumber}
          description={`${booking.customerName} · ${booking.destination}`}
          breadcrumbs={['Operations', 'Bookings', booking.bookingNumber]}
        />
      </div>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-teal-500/15 bg-gradient-to-br from-teal-600/15 via-cyan-500/10 to-violet-500/10 p-6 sm:p-8"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <BookingStatusBadge status={booking.status} />
            <h1 className="text-2xl sm:text-3xl font-black text-content-primary mt-3 tracking-tight">
              {booking.packageName || booking.destination}
            </h1>
            <p className="text-sm text-content-secondary mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{booking.destination}</span>
              <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" />{formatPax(booking)}</span>
              <span>{formatTravelRange(booking)}</span>
            </p>
            <p className="text-xs text-content-muted mt-2">
              Quote {booking.quotationReference || '—'} · Executive {booking.executiveName || '—'}
            </p>
          </div>
          <div className="text-left lg:text-right shrink-0">
            <p className="text-3xl sm:text-4xl font-black text-teal-600 tabular-nums">{formatINR(amount)}</p>
            <p className="text-xs text-content-muted capitalize mt-1">Payment: {booking.paymentStatus || 'pending'}</p>
            <p className="text-sm text-amber-600 font-semibold mt-1">Pending {formatINR(booking.pendingAmount)}</p>
          </div>
        </div>
      </motion.div>

      <QuotationSyncBanner
        meta={quoteMeta}
        autoSynced={booking.autoSyncedFromQuotation}
        syncing={syncingQuote}
        onSync={syncFromQuotation}
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8 space-y-6">
          <BookingItineraryTimeline
            itinerary={itinerary}
            onChange={setItinerary}
            onSave={saveItinerary}
            saving={savingItinerary}
            onPdf={generateItineraryPdf}
            generatingPdf={generatingPdf}
            pdfUrl={itineraryPdfUrl}
            catalogHotels={catalogHotels}
            catalogCabs={catalogCabs}
          />

          <BookingHotelsEditor
            hotels={hotels}
            onChange={setHotels}
            onSave={saveHotels}
            saving={savingHotels}
            catalogHotels={catalogHotels}
          />

          <BookingTransportEditor
            transport={transport}
            onChange={setTransport}
            onSave={saveTransport}
            saving={savingTransport}
            catalogCabs={catalogCabs}
          />

          {booking.activities?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-subtle bg-surface/80 p-6"
            >
              <h3 className="font-bold text-lg mb-4">Activities</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {booking.activities.map((a, i) => (
                  <div key={i} className="p-4 rounded-2xl border border-subtle bg-gradient-to-br from-rose-500/5 to-orange-500/5">
                    <p className="font-semibold">{a.name || a}</p>
                    <p className="text-xs text-content-muted mt-1 capitalize">{a.status || 'pending'}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-subtle bg-surface/80 p-6 space-y-4"
          >
            <h3 className="font-bold flex items-center gap-2 text-lg"><FileText className="w-5 h-5 text-indigo-600" /> Documents</h3>
            <form onSubmit={addDocument} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <select value={docForm.type} onChange={(e) => setDocForm((f) => ({ ...f, type: e.target.value }))} className="input-premium h-10 rounded-xl text-sm">
                {DOC_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
              <input value={docForm.fileName} onChange={(e) => setDocForm((f) => ({ ...f, fileName: e.target.value }))} placeholder="File name" className="input-premium h-10 rounded-xl text-sm" />
              <input value={docForm.fileUrl} onChange={(e) => setDocForm((f) => ({ ...f, fileUrl: e.target.value }))} placeholder="Document URL" required className="input-premium h-10 rounded-xl text-sm sm:col-span-2" />
              <Button type="submit" variant="teal" size="sm" className="rounded-xl h-10" disabled={addingDoc}>Add URL</Button>
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
          </motion.div>
        </div>

        <aside className="xl:col-span-4 space-y-4 xl:sticky xl:top-20">
          <div className="rounded-3xl border border-subtle bg-surface/90 p-5 shadow-sm">
            <h3 className="font-bold mb-4">Customer</h3>
            <p className="font-bold text-xl text-content-primary">{booking.customerName}</p>
            <div className="mt-3 space-y-2 text-sm text-content-secondary">
              <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-teal-600" />{booking.customerPhone || '—'}</p>
              <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-teal-600" />{booking.customerEmail || '—'}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-subtle bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-5">
            <h3 className="font-bold mb-3 flex items-center gap-2"><Wallet className="w-4 h-4 text-emerald-600" /> Payment</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-content-muted">Advance</span><span className="font-bold">{formatINR(booking.advanceReceived)}</span></div>
              <div className="flex justify-between"><span className="text-content-muted">Pending</span><span className="font-bold text-amber-600">{formatINR(booking.pendingAmount)}</span></div>
              <div className="h-px bg-subtle my-2" />
              <div className="flex justify-between"><span className="font-medium">Total</span><span className="font-black text-lg">{formatINR(amount)}</span></div>
            </div>
          </div>

          <div className="rounded-3xl border border-subtle bg-surface/90 p-5 space-y-2">
            <h3 className="font-bold mb-3">Quick Actions</h3>
            {booking.hotelConfirmation === 'pending' && (
              <Button variant="teal" className="w-full rounded-xl gap-2" disabled={actionLoading === 'hotel'} onClick={confirmHotel}>
                {actionLoading === 'hotel' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Confirm All Hotels
              </Button>
            )}
            {booking.cabConfirmation === 'pending' && (
              <Button variant="violet" className="w-full rounded-xl gap-2" disabled={actionLoading === 'cab'} onClick={confirmCab}>
                {actionLoading === 'cab' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Confirm Transport
              </Button>
            )}
            {booking.status === 'confirmed' && (
              <Button variant="emerald" className="w-full rounded-xl gap-2" disabled={actionLoading === 'in_progress'} onClick={() => updateStatus('in_progress')}>
                Mark In Progress
              </Button>
            )}
            {booking.status === 'in_progress' && (
              <Button variant="secondary" className="w-full rounded-xl gap-2" disabled={actionLoading === 'completed'} onClick={() => updateStatus('completed')}>
                Mark Completed
              </Button>
            )}
            <Link to="/operations-manager/vouchers">
              <Button variant="outline" className="w-full rounded-xl gap-2">
                <Ticket className="w-4 h-4" /> Generate Voucher
              </Button>
            </Link>
          </div>

          {(booking.tasks?.length > 0) && (
            <div className="rounded-3xl border border-subtle bg-surface/90 p-5 space-y-3">
              <h3 className="font-bold flex items-center gap-2"><ListTodo className="w-4 h-4" /> Tasks</h3>
              {booking.tasks.map((t) => (
                <div key={t._id} className="p-3 rounded-xl border border-subtle text-sm">
                  <p className="font-medium">{t.title}</p>
                  <div className="flex items-center justify-between mt-2 gap-2">
                    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-md capitalize', TASK_STATUS[t.status])}>{t.status?.replace(/_/g, ' ')}</span>
                    {t.status !== 'completed' && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => updateTaskStatus(t._id, t.status === 'pending' ? 'in_progress' : 'completed')}>
                        {t.status === 'pending' ? 'Start' : 'Done'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
