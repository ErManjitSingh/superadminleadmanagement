import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import API from '../../../api/axios';
import {
  QuotationSyncBanner,
  BookingHotelsEditor,
  BookingTransportEditor,
  BookingItineraryTimeline,
} from './BookingFulfillmentSections';
import VoucherCenter from '../vouchers/VoucherCenter';
import ExecutionTimeline from '../vouchers/ExecutionTimeline';
import BookingPaymentsPanel from '../../payments/BookingPaymentsPanel';
import QuotationPdfOverlay from '../../quotations/QuotationPdfOverlay';
import { acknowledgeNewBooking, getBookingPayments } from '../../../services/bookingPaymentsApi';
import { fetchBookingExecution } from '../../../services/operationsVoucherApi';
import { useAuth } from '../../../context/AuthContext';
import {
  BookingDetailHeader,
  BookingPackageHero,
  BookingPaymentOverview,
  BookingProgressStepper,
  BookingInfoColumns,
  BookingDetailMobileBar,
} from './BookingDetailSections';
import { buildBookingProgressSteps, computeNextPaymentDue, hasLinkedQuotation } from './bookingDetailUtils';
import { useDataRefresh } from '../../../hooks/useDataRefresh';

function applyBookingState(data, setters) {
  const { setBooking, setItinerary, setHotels, setTransport } = setters;
  setBooking(data);
  setItinerary(data.itinerary?.length ? data.itinerary : [{ day: 1, title: '', description: '' }]);
  setHotels(data.hotels?.length ? data.hotels : []);
  setTransport(data.transport?.length ? data.transport : []);
}

export default function BookingDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [execution, setExecution] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [itinerary, setItinerary] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [transport, setTransport] = useState([]);
  const [savingItinerary, setSavingItinerary] = useState(false);
  const [savingHotels, setSavingHotels] = useState(false);
  const [savingTransport, setSavingTransport] = useState(false);
  const [syncingQuote, setSyncingQuote] = useState(false);
  const [itineraryPdfUrl, setItineraryPdfUrl] = useState(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [catalogHotels, setCatalogHotels] = useState([]);
  const [catalogCabs, setCatalogCabs] = useState([]);
  const [manageOpen, setManageOpen] = useState(false);
  const [pdfQuote, setPdfQuote] = useState(null);
  const [quotationLoading, setQuotationLoading] = useState(false);
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const pdfRef = useRef(null);
  const manageRef = useRef(null);

  const setters = { setBooking, setItinerary, setHotels, setTransport };
  const canAddPayment = ['operations_manager', 'admin', 'accountant'].includes(user?.role);

  const reloadPayments = useCallback(() => {
    getBookingPayments(id).then(setPaymentData).catch(() => setPaymentData(null));
  }, [id]);

  const reloadExecution = useCallback(() => {
    fetchBookingExecution(id).then(setExecution).catch(() => setExecution(null));
  }, [id]);

  const refreshBookingData = useCallback(async (silent = true) => {
    try {
      const [bookingRes, exec, payments] = await Promise.all([
        API.get(`/operations-manager/bookings/${id}`, { skipSuccessToast: true }),
        fetchBookingExecution(id).catch(() => null),
        getBookingPayments(id).catch(() => null),
      ]);
      if (bookingRes.data) applyBookingState(bookingRes.data, setters);
      if (exec) setExecution(exec);
      if (payments) setPaymentData(payments);
    } catch {
      if (!silent) setBooking(null);
    }
  }, [id]);

  const fetchBooking = async () => {
    setLoading(true);
    try {
      const r = await API.get(`/operations-manager/bookings/${id}`);
      let data = r.data;
      if (data?.isNewBooking && ['operations_manager', 'admin'].includes(user?.role)) {
        await acknowledgeNewBooking(id, { skipSuccessToast: true }).catch(() => {});
        data = { ...data, isNewBooking: false };
      }
      applyBookingState(data, setters);
      await Promise.all([reloadExecution(), reloadPayments()]);
    } finally {
      setLoading(false);
    }
  };

  useDataRefresh(['operations', `booking:${id}`], () => refreshBookingData(true));

  useEffect(() => { fetchBooking(); }, [id, user?.role]);

  useEffect(() => {
    Promise.all([
      API.get('/operations-manager/hotels', { params: { limit: 500 }, skipSuccessToast: true }),
      API.get('/operations-manager/transport', { params: { catalog: true }, skipSuccessToast: true }),
    ]).then(([hotelsRes, transportRes]) => {
      setCatalogHotels(hotelsRes.data?.data ?? hotelsRes.data ?? []);
      setCatalogCabs(transportRes.data?.cabs || []);
    }).catch(() => {});
  }, []);

  const syncFromQuotation = async () => {
    setSyncingQuote(true);
    try {
      const r = await API.post(`/operations-manager/bookings/${id}/sync-quotation`, { force: true });
      applyBookingState(r.data, setters);
      reloadExecution();
    } finally {
      setSyncingQuote(false);
    }
  };

  const saveItinerary = async () => {
    setSavingItinerary(true);
    try {
      await API.put(`/operations-manager/bookings/${id}`, { itinerary });
      await refreshBookingData(true);
    } finally {
      setSavingItinerary(false);
    }
  };

  const saveHotels = async () => {
    setSavingHotels(true);
    try {
      await API.put(`/operations-manager/bookings/${id}`, { hotels });
      await refreshBookingData(true);
    } finally {
      setSavingHotels(false);
    }
  };

  const saveTransport = async () => {
    setSavingTransport(true);
    try {
      await API.put(`/operations-manager/bookings/${id}`, { transport });
      await refreshBookingData(true);
    } finally {
      setSavingTransport(false);
    }
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

  const openQuotation = async () => {
    if (!hasLinkedQuotation(booking)) return;
    setQuotationLoading(true);
    try {
      const { data } = await API.get(`/operations-manager/bookings/${id}/quotation`, { skipSuccessToast: true });
      setPdfQuote(data);
    } finally {
      setQuotationLoading(false);
    }
  };

  const scrollTo = (selector) => {
    document.querySelector(selector)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openManage = () => {
    setManageOpen(true);
    setTimeout(() => manageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const paymentSummary = paymentData?.summary;
  const progressSteps = useMemo(
    () => buildBookingProgressSteps(booking, execution, paymentSummary),
    [booking, execution, paymentSummary],
  );
  const nextDue = useMemo(
    () => computeNextPaymentDue(booking, paymentData?.payments, paymentSummary),
    [booking, paymentData, paymentSummary],
  );

  const showQuotation = hasLinkedQuotation(booking);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-content-muted">Loading booking details...</p>
      </div>
    );
  }

  if (!booking) return <div className="text-center py-20 text-content-muted">Booking not found</div>;

  return (
    <div className="space-y-6 pb-24 lg:pb-10">
      <BookingDetailHeader booking={booking} onPrint={() => window.print()} />

      <BookingPackageHero
        booking={booking}
        onViewQuotation={showQuotation ? openQuotation : undefined}
        quotationLoading={quotationLoading}
      />

      <BookingPaymentOverview summary={paymentSummary} nextDue={nextDue} />

      <BookingProgressStepper steps={progressSteps} />

      <QuotationSyncBanner
        meta={booking.quotationMeta || booking.quotationPreview?.meta}
        autoSynced={booking.autoSyncedFromQuotation}
        syncing={syncingQuote}
        onSync={syncFromQuotation}
      />

      <VoucherCenter
        bookingId={id}
        booking={booking}
        execution={execution}
        onExecutionChange={setExecution}
      />

      <BookingInfoColumns booking={booking} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        <div className="lg:col-span-8">
          <ExecutionTimeline events={execution?.timeline || []} compact />
        </div>
        <div className="lg:col-span-4 lg:sticky lg:top-20" id="booking-payments">
          <BookingPaymentsPanel
            bookingId={id}
            variant="sidebar"
            summary={paymentSummary}
            addOpen={addPaymentOpen}
            onAddOpenChange={setAddPaymentOpen}
            onUpdated={(updated) => {
              if (updated) setBooking((b) => ({ ...b, ...updated }));
              refreshBookingData(true);
            }}
          />
        </div>
      </div>

      <BookingPaymentsPanel
        bookingId={id}
        variant="history"
        onUpdated={(updated) => {
          if (updated) setBooking((b) => ({ ...b, ...updated }));
          refreshBookingData(true);
        }}
      />

      <div ref={manageRef} className="rounded-2xl border border-subtle bg-surface overflow-hidden">
        <button
          type="button"
          onClick={() => setManageOpen((o) => !o)}
          className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-surface-muted/50 transition-colors"
        >
          <span className="font-bold text-content-primary">Manage Fulfillment (Itinerary, Hotels, Transport)</span>
          <ChevronDown className={`w-5 h-5 text-content-muted transition-transform ${manageOpen ? 'rotate-180' : ''}`} />
        </button>
        {manageOpen && (
          <div className="border-t border-subtle p-5 space-y-6">
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
          </div>
        )}
      </div>

      <BookingDetailMobileBar
        onVouchers={() => scrollTo('#voucher-center')}
        onPayment={() => {
          scrollTo('#booking-payments');
          setAddPaymentOpen(true);
        }}
        onQuotation={openQuotation}
        onManage={openManage}
        showQuotation={showQuotation}
        showPayment={canAddPayment && paymentSummary?.paymentStatus !== 'paid'}
      />

      <QuotationPdfOverlay
        quote={pdfQuote}
        open={!!pdfQuote}
        onClose={() => setPdfQuote(null)}
        pdfRef={pdfRef}
      />
    </div>
  );
}
