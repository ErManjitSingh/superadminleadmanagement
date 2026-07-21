import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Eye, Loader2 } from 'lucide-react';
import { ACTIVITY_CONFIG, findQuotationForActivity } from './leadDetailData';
import QuotationPdfOverlay from '../quotations/QuotationPdfOverlay';
import ReceiptPdfPreviewModal from '../payments/ReceiptPdfPreviewModal';
import { Button } from '../ui/button';
import { DETAIL_CARD } from './leadDetailUtils';
import { downloadReceiptPdf, getLeadBooking } from '../../services/bookingPaymentsApi';
import { toast } from '../../context/ToastContext';

function formatActivityDate(iso) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
  };
}

function idOf(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') return String(value._id || value.id || '');
  return String(value);
}

function isPaymentActivity(type) {
  return ['advance_payment_received', 'payment_received', 'receipt_sent'].includes(type);
}

export default function LeadActivityTimeline({
  activities,
  loading = false,
  quotations = [],
  leadId,
}) {
  const [pdfQuote, setPdfQuote] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [receiptLoading, setReceiptLoading] = useState(null);
  const [bookingFallback, setBookingFallback] = useState(null);
  const pdfRef = useRef(null);
  const timelineRef = useRef(null);
  const sorted = useMemo(
    () => [...activities].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [activities],
  );

  useEffect(() => {
    if (!leadId || window.location.hash !== '#activity-timeline') return undefined;
    const timer = window.setTimeout(() => {
      timelineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    return () => window.clearTimeout(timer);
  }, [leadId, loading]);

  useEffect(() => {
    if (!leadId) {
      setBookingFallback(null);
      return;
    }
    const needsFallback = sorted.some(
      (item) => isPaymentActivity(item.type) && (!idOf(item.meta?.bookingId) || !idOf(item.meta?.paymentId)),
    );
    if (!needsFallback) {
      setBookingFallback(null);
      return;
    }

    let cancelled = false;
    getLeadBooking(leadId)
      .then((res) => {
        if (!cancelled) setBookingFallback(res);
      })
      .catch(() => {
        if (!cancelled) setBookingFallback(null);
      });

    return () => {
      cancelled = true;
    };
  }, [leadId, sorted]);

  const resolveReceiptIds = (item) => {
    const bookingId = idOf(item.meta?.bookingId) || idOf(bookingFallback?.booking?._id);
    const paymentId = idOf(item.meta?.paymentId) || idOf(bookingFallback?.advancePayment?._id);
    return { bookingId, paymentId };
  };

  const canOpenReceipt = (item) => {
    if (!isPaymentActivity(item.type)) return false;
    const { bookingId, paymentId } = resolveReceiptIds(item);
    return Boolean(bookingId && paymentId);
  };

  const openReceiptPreview = (item) => {
    const { bookingId, paymentId } = resolveReceiptIds(item);
    if (!bookingId || !paymentId) {
      toast.error('Advance voucher PDF available nahi hai.');
      return;
    }
    setReceiptPreview({
      bookingId,
      paymentId,
      title: item.title || ACTIVITY_CONFIG[item.type]?.label || 'Payment Voucher',
      fileName: item.meta?.receiptNumber ? `${item.meta.receiptNumber}.pdf` : 'advance-voucher.pdf',
    });
  };

  const downloadReceipt = async (item) => {
    const { bookingId, paymentId } = resolveReceiptIds(item);
    if (!bookingId || !paymentId) return;

    const key = `${item.id}-download`;
    setReceiptLoading(key);
    try {
      await downloadReceiptPdf(
        bookingId,
        paymentId,
        item.meta?.receiptNumber ? `${item.meta.receiptNumber}.pdf` : 'advance-voucher.pdf',
      );
    } catch {
      toast.error('Advance voucher PDF download nahi ho paya.');
    } finally {
      setReceiptLoading(null);
    }
  };

  return (
    <>
      <div
        ref={timelineRef}
        id="activity-timeline"
        className={`${DETAIL_CARD} scroll-mt-24 overflow-hidden`}
      >
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Activity Timeline</h3>
        </div>
        <div className="p-5">
          {loading && (
            <p className="text-sm text-slate-400 text-center py-6">Loading timeline...</p>
          )}
          {!loading && sorted.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">No activity yet</p>
          )}
          {!loading && sorted.length > 0 && (
            <div className="relative max-h-[26.5rem] overflow-y-auto overscroll-contain pr-1">
              <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-violet-300 via-slate-200 to-transparent dark:from-violet-800 dark:via-slate-700" />
              <div className="space-y-1">
                {sorted.map((item, i) => {
                  const cfg = ACTIVITY_CONFIG[item.type] || ACTIVITY_CONFIG.status_changed;
                  const Icon = cfg.icon;
                  const { date, time } = formatActivityDate(item.date);
                  const quote = item.type?.startsWith('quotation_')
                    ? findQuotationForActivity(item, quotations)
                    : null;
                  const canDownloadQuote = Boolean(quote?._id && (quote.pricing || quote.packageSnapshot));
                  const showReceiptActions = canOpenReceipt(item);

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="relative flex gap-4 py-3 group"
                    >
                      <div className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-slate-100 ${cfg.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0 pb-1 border-b border-slate-50 dark:border-slate-800 last:border-0">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.title || cfg.label}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              <span className="font-medium text-slate-600 dark:text-slate-300">{item.user}</span>
                              {' · '}{date} at {time}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {canDownloadQuote && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setPdfQuote(quote)}
                                className="rounded-lg h-7 gap-1 text-[11px] text-violet-700 border-violet-200 bg-violet-50 hover:bg-violet-100"
                              >
                                <Download className="w-3 h-3" /> PDF
                              </Button>
                            )}
                            {showReceiptActions && (
                              <>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openReceiptPreview(item)}
                                  className="rounded-lg h-7 gap-1 text-[11px] text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
                                >
                                  <Eye className="w-3 h-3" />
                                  View PDF
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={!!receiptLoading}
                                  onClick={() => downloadReceipt(item)}
                                  className="rounded-lg h-7 gap-1 text-[11px] text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
                                >
                                  {receiptLoading === `${item.id}-download` ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Download className="w-3 h-3" />
                                  )}
                                  PDF
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        {item.notes && (
                          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                            {item.notes}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <QuotationPdfOverlay
        quote={pdfQuote}
        open={!!pdfQuote}
        onClose={() => setPdfQuote(null)}
        pdfRef={pdfRef}
      />

      <ReceiptPdfPreviewModal
        open={!!receiptPreview}
        onClose={() => setReceiptPreview(null)}
        bookingId={receiptPreview?.bookingId}
        paymentId={receiptPreview?.paymentId}
        title={receiptPreview?.title}
        fileName={receiptPreview?.fileName}
      />
    </>
  );
}
