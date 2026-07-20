import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react';
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
import BookingPaymentsPanel from '../../payments/BookingPaymentsPanel';
import { acknowledgeNewBooking, getBookingPayments } from '../../../services/bookingPaymentsApi';
import { fetchBookingExecution } from '../../../services/operationsVoucherApi';
import { useAuth } from '../../../context/AuthContext';
import {
  BookingCommandHero,
  BookingCommandProgress,
  BookingActionCenter,
  BookingDetailGrid,
  BookingPaymentDonut,
  BookingDocumentCenter,
  BookingCommunicationPanel,
  BookingFeedsRow,
  BookingCommandFooter,
} from './BookingCommandCenter';
import {
  buildCommandProgressSteps,
  buildActionCenterItems,
  bookingHasHotels,
  filterTimelineForHotels,
  hasLinkedQuotation,
} from './bookingDetailUtils';
import { useDataRefresh } from '../../../hooks/useDataRefresh';

const QuotationPdfOverlay = lazy(() => import('../../quotations/QuotationPdfOverlay'));

function applyBookingState(data, setters) {
  const { setBooking, setItinerary, setHotels, setTransport } = setters;
  setBooking(data);
  setItinerary(data.itinerary?.length ? data.itinerary : [{ day: 1, title: '', description: '' }]);
  setHotels(data.hotels?.length ? data.hotels : []);
  setTransport(data.transport?.length ? data.transport : []);
}

function waLink(phone, text = '') {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return null;
  const n = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
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
  const [catalogVendors, setCatalogVendors] = useState([]);
  const [manageOpen, setManageOpen] = useState(false);
  const [pdfQuote, setPdfQuote] = useState(null);
  const [quotationLoading, setQuotationLoading] = useState(false);
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [confirmingCab, setConfirmingCab] = useState(false);
  const pdfRef = useRef(null);
  const manageRef = useRef(null);
  const voucherRef = useRef(null);

  const setters = { setBooking, setItinerary, setHotels, setTransport };
  const canAddPayment = ['operations_manager', 'admin', 'accountant'].includes(user?.role);

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
      const [bookingRes, exec, payments] = await Promise.all([
        API.get(`/operations-manager/bookings/${id}`),
        fetchBookingExecution(id).catch(() => null),
        getBookingPayments(id).catch(() => null),
      ]);
      let data = bookingRes.data;
      if (data?.isNewBooking && ['operations_manager', 'admin'].includes(user?.role)) {
        await acknowledgeNewBooking(id, { skipSuccessToast: true }).catch(() => {});
        data = { ...data, isNewBooking: false };
      }
      applyBookingState(data, setters);
      if (exec) setExecution(exec);
      if (payments) setPaymentData(payments);
    } finally {
      setLoading(false);
    }
  };

  useDataRefresh(['operations', `booking:${id}`], () => refreshBookingData(true), true, 400);

  useEffect(() => { fetchBooking(); }, [id, user?.role]);

  useEffect(() => {
    if (!manageOpen) return;
    if (catalogHotels.length && catalogCabs.length && catalogVendors.length) return;
    Promise.all([
      API.get('/hotels', { skipSuccessToast: true, skipErrorToast: true }),
      API.get('/operations-manager/transport', { params: { catalog: true }, skipSuccessToast: true, skipErrorToast: true })
        .catch(() => ({ data: { cabs: [] } })),
      API.get('/vendors', { params: { status: 'active' }, skipSuccessToast: true, skipErrorToast: true }),
    ]).then(([hotelsRes, transportRes, vendorsRes]) => {
      setCatalogHotels(hotelsRes.data?.data ?? hotelsRes.data ?? []);
      setCatalogCabs(transportRes.data?.cabs || []);
      setCatalogVendors(Array.isArray(vendorsRes.data) ? vendorsRes.data : vendorsRes.data?.data || []);
    }).catch(() => {});
  }, [manageOpen, catalogHotels.length, catalogCabs.length, catalogVendors.length]);

  const syncFromQuotation = async () => {
    setSyncingQuote(true);
    try {
      const r = await API.post(`/operations-manager/bookings/${id}/sync-quotation`, { force: true });
      applyBookingState(r.data, setters);
      refreshBookingData(true);
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
      const allConfirmed = (transport || []).length > 0
        && (transport || []).every((t) => t.status === 'confirmed');
      await API.put(`/operations-manager/bookings/${id}`, {
        transport,
        ...(allConfirmed ? { cabConfirmation: 'confirmed' } : {}),
      });
      await refreshBookingData(true);
    } finally {
      setSavingTransport(false);
    }
  };

  const confirmCab = async () => {
    if (!window.confirm('Mark cab as confirmed? Use this after you finalize driver/vendor by call or WhatsApp.')) return;
    setConfirmingCab(true);
    try {
      const { data } = await API.post(`/operations-manager/bookings/${id}/confirm-cab`);
      if (data) {
        setBooking((b) => ({ ...b, ...data }));
        setTransport(data.transport?.length ? data.transport : []);
      }
      await refreshBookingData(true);
    } finally {
      setConfirmingCab(false);
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

  const openManage = () => {
    setManageOpen(true);
    setTimeout(() => manageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };

  const scrollToVouchers = () => {
    voucherRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const callCustomer = () => {
    if (booking?.customerPhone) window.open(`tel:${booking.customerPhone}`, '_self');
  };

  const whatsAppCustomer = () => {
    const url = waLink(booking?.customerPhone, `Hi ${booking?.customerName || ''}, regarding booking ${booking?.bookingNumber}`);
    if (url) window.open(url, '_blank');
  };

  const completeBooking = async () => {
    if (!window.confirm('Mark this booking as completed?')) return;
    await API.put(`/operations-manager/bookings/${id}`, { status: 'completed' });
    await refreshBookingData(true);
  };

  const paymentSummary = paymentData?.summary;
  const hasHotels = bookingHasHotels(booking);
  const progressSteps = useMemo(
    () => buildCommandProgressSteps(booking, execution, paymentSummary),
    [booking, execution, paymentSummary],
  );
  const actionItems = useMemo(
    () => buildActionCenterItems(booking, execution, paymentSummary),
    [booking, execution, paymentSummary],
  );
  const timelineEvents = useMemo(
    () => filterTimelineForHotels(execution?.timeline || [], hasHotels),
    [execution?.timeline, hasHotels],
  );
  const showQuotation = hasLinkedQuotation(booking);
  const showPayment = canAddPayment && paymentSummary?.paymentStatus !== 'paid';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-content-muted">Loading booking details...</p>
      </div>
    );
  }

  if (!booking) {
    return <div className="text-center py-20 text-content-muted">Booking not found</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-5 pb-28">
      <BookingCommandHero
        booking={booking}
        summary={paymentSummary}
        onPrint={() => window.print()}
        onDownloadPdf={generateItineraryPdf}
        onEdit={openManage}
        onCall={callCustomer}
        onWhatsApp={whatsAppCustomer}
        onViewQuote={showQuotation ? openQuotation : undefined}
      />

      <BookingCommandProgress steps={progressSteps} />

      <BookingActionCenter items={actionItems} onResolveAll={openManage} />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-4 sm:gap-5 items-start">
        <div className="space-y-4 sm:space-y-5 min-w-0">
          <BookingDetailGrid
            booking={booking}
            onHotelVoucher={scrollToVouchers}
            onCabManage={openManage}
            onConfirmCab={confirmCab}
            confirmingCab={confirmingCab}
            onCallHotel={() => {
              const phone = booking.hotels?.[0]?.phone || booking.hotels?.[0]?.vendorPhone;
              if (phone) window.open(`tel:${phone}`, '_self');
            }}
          />

          <QuotationSyncBanner
            meta={booking.quotationMeta || booking.quotationPreview?.meta}
            autoSynced={booking.autoSyncedFromQuotation}
            syncing={syncingQuote}
            onSync={syncFromQuotation}
          />

          <div ref={voucherRef} id="voucher-center">
            <VoucherCenter
              bookingId={id}
              booking={booking}
              execution={execution}
              onExecutionChange={setExecution}
            />
          </div>

          <BookingFeedsRow
            timelineEvents={timelineEvents}
            notes={booking.internalNotes || []}
            onAddNote={openManage}
          />
        </div>

        <aside className="space-y-4 xl:sticky xl:top-4">
          <div id="booking-payments">
            <BookingPaymentDonut
              summary={paymentSummary}
              onCollect={() => {
                document.getElementById('booking-payments')?.scrollIntoView({ behavior: 'smooth' });
                setAddPaymentOpen(true);
              }}
            />
          </div>
          <BookingDocumentCenter
            booking={booking}
            execution={execution}
            onOpenQuote={openQuotation}
            onOpenVouchers={scrollToVouchers}
            onOpenPdf={generateItineraryPdf}
          />
          <BookingCommunicationPanel
            booking={booking}
            onWhatsApp={whatsAppCustomer}
            onCall={callCustomer}
            onEmail={() => {
              if (booking.customerEmail) window.open(`mailto:${booking.customerEmail}`, '_self');
            }}
          />
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
        </aside>
      </div>

      <BookingPaymentsPanel
        bookingId={id}
        variant="history"
        paymentsData={paymentData}
        onUpdated={(updated) => {
          if (updated) setBooking((b) => ({ ...b, ...updated }));
          refreshBookingData(true);
        }}
      />

      <div ref={manageRef} className="rounded-2xl border border-subtle bg-white shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setManageOpen((o) => !o)}
          className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
        >
          <span className="font-bold text-content-primary">
            Manage Fulfillment
            <span className="ml-2 text-xs font-medium text-content-muted">
              Itinerary{hasHotels ? ' · Hotels' : ''} · Transport
            </span>
          </span>
          <ChevronDown className={`w-5 h-5 text-content-muted transition-transform ${manageOpen ? 'rotate-180' : ''}`} />
        </button>
        {manageOpen && (
          <div className="border-t border-subtle p-4 sm:p-5 space-y-6">
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
            {hasHotels && (
              <BookingHotelsEditor
                hotels={hotels}
                onChange={setHotels}
                onSave={saveHotels}
                saving={savingHotels}
                catalogHotels={catalogHotels}
                onCatalogHotelsChange={setCatalogHotels}
              />
            )}
            <BookingTransportEditor
              transport={transport}
              onChange={setTransport}
              onSave={saveTransport}
              saving={savingTransport}
              catalogCabs={catalogCabs}
              catalogVendors={catalogVendors}
              onCatalogVendorsChange={setCatalogVendors}
              onConfirmCab={confirmCab}
              confirmingCab={confirmingCab}
              cabConfirmed={booking.cabConfirmation === 'confirmed'}
            />
          </div>
        )}
      </div>

      <BookingCommandFooter
        onSave={openManage}
        onAssignVendor={openManage}
        onGenerateVoucher={scrollToVouchers}
        onCollectPayment={() => {
          document.getElementById('booking-payments')?.scrollIntoView({ behavior: 'smooth' });
          setAddPaymentOpen(true);
        }}
        onDownloadPdf={generateItineraryPdf}
        onComplete={completeBooking}
        showPayment={showPayment}
      />

      <Suspense fallback={null}>
        {pdfQuote && (
          <QuotationPdfOverlay
            quote={pdfQuote}
            open={!!pdfQuote}
            onClose={() => setPdfQuote(null)}
            pdfRef={pdfRef}
          />
        )}
      </Suspense>

      {quotationLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="rounded-2xl bg-white px-6 py-4 shadow-xl text-sm font-semibold text-content-primary">
            Loading quotation…
          </div>
        </div>
      )}
    </div>
  );
}
