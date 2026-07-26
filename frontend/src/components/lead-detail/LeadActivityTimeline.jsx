import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, Eye, Loader2, Pencil } from 'lucide-react';
import {
  ACTIVITY_CONFIG,
  ensureQuotationTimelineActivities,
  findQuotationForActivity,
} from './leadDetailData';
import QuotationPdfOverlay from '../quotations/QuotationPdfOverlay';
import ReceiptPdfPreviewModal from '../payments/ReceiptPdfPreviewModal';
import { Button } from '../ui/button';
import { DETAIL_CARD } from './leadDetailUtils';
import { downloadReceiptPdf, getLeadBooking } from '../../services/bookingPaymentsApi';
import { toast } from '../../context/ToastContext';
import API from '../../api/axios';

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

function unwrapQuotations(data) {
  if (Array.isArray(data)) return data;
  return data?.quotations || data?.items || data?.data || [];
}

export default function LeadActivityTimeline({
  activities,
  loading = false,
  quotations = [],
  leadId,
  quoteEditPath = '',
  relatedBasePath = '/leads',
}) {
  const navigate = useNavigate();
  const [pdfQuote, setPdfQuote] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [receiptLoading, setReceiptLoading] = useState(null);
  const [bookingFallback, setBookingFallback] = useState(null);
  const [autoPrintQuote, setAutoPrintQuote] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(null);
  const [fetchedQuotes, setFetchedQuotes] = useState([]);
  const [quotesLookupDone, setQuotesLookupDone] = useState(false);
  const pdfRef = useRef(null);
  const timelineRef = useRef(null);

  const quoteList = useMemo(() => {
    if (quotations?.length) return quotations;
    return fetchedQuotes;
  }, [quotations, fetchedQuotes]);

  const sorted = useMemo(() => {
    const withQuotes = ensureQuotationTimelineActivities(activities, quoteList);
    return [...withQuotes].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [activities, quoteList]);

  const hasSavedQuote = quoteList.length > 0;
  const hasQuoteActivity = sorted.some((a) => a.type?.startsWith('quotation_'));
  const showTimelineEditBar = Boolean(quoteEditPath && leadId && (hasQuoteActivity || hasSavedQuote));
  const editBarLabel = hasSavedQuote ? 'Edit Quotation' : 'Create Quotation';

  useEffect(() => {
    if (!leadId || window.location.hash !== '#activity-timeline') return undefined;
    const timer = window.setTimeout(() => {
      timelineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    return () => window.clearTimeout(timer);
  }, [leadId, loading]);

  useEffect(() => {
    if (!leadId) {
      setFetchedQuotes([]);
      setQuotesLookupDone(false);
      return undefined;
    }

    if (quotations?.length) {
      setFetchedQuotes([]);
      setQuotesLookupDone(true);
      return undefined;
    }

    let cancelled = false;
    setQuotesLookupDone(false);

    (async () => {
      let items = [];
      try {
        const { data } = await API.get(`${relatedBasePath}/${leadId}/quotations`, {
          params: { page: 1, limit: 20 },
          skipSuccessToast: true,
          skipErrorToast: true,
        });
        items = unwrapQuotations(data);
      } catch {
        items = [];
      }

      if (!items.length) {
        try {
          const bookingRes = await getLeadBooking(leadId);
          const bookingQuoteId = idOf(bookingRes?.booking?.quotation);
          if (bookingQuoteId) {
            const { data } = await API.get(`/quotations/${bookingQuoteId}`, {
              skipSuccessToast: true,
              skipErrorToast: true,
            });
            const q = data?.quotation || data;
            if (q?._id) items = [q];
          }
        } catch {
          // ignore
        }
      }

      if (!items.length) {
        try {
          const { data } = await API.get('/quotations', {
            params: { lead: leadId, leadId, page: 1, limit: 20 },
            skipSuccessToast: true,
            skipErrorToast: true,
          });
          items = unwrapQuotations(data);
        } catch {
          items = [];
        }
      }

      if (!cancelled) {
        setFetchedQuotes(items);
        setQuotesLookupDone(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [leadId, relatedBasePath, quotations?.length]);

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

  const resolveQuotationId = async (item, quote) => {
    const direct = idOf(quote?._id || quote?.id) || idOf(item?.meta?.quotationId);
    if (direct) return direct;

    const matched = findQuotationForActivity(item, quoteList);
    if (matched) return idOf(matched._id || matched.id);

    if (quoteList.length === 1) return idOf(quoteList[0]._id || quoteList[0].id);
    if (quoteList.length > 1) {
      const latest = [...quoteList].sort(
        (a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)
      )[0];
      return idOf(latest?._id || latest?.id);
    }

    if (!leadId) return '';

    try {
      const { data } = await API.get(`${relatedBasePath}/${leadId}/quotations`, {
        params: { page: 1, limit: 20 },
        skipSuccessToast: true,
        skipErrorToast: true,
      });
      const items = unwrapQuotations(data);
      setFetchedQuotes(items);
      const fromLeadApi = idOf(items[0]?._id || items[0]?.id);
      if (fromLeadApi) return fromLeadApi;
    } catch {
      // continue to booking / global list fallbacks
    }

    try {
      const bookingRes = await getLeadBooking(leadId);
      const bookingQuoteId = idOf(bookingRes?.booking?.quotation);
      if (bookingQuoteId) return bookingQuoteId;
    } catch {
      // ignore
    }

    try {
      const { data } = await API.get('/quotations', {
        params: { lead: leadId, leadId, page: 1, limit: 20 },
        skipSuccessToast: true,
        skipErrorToast: true,
      });
      const items = unwrapQuotations(data);
      if (items.length) {
        setFetchedQuotes(items);
        return idOf(items[0]?._id || items[0]?.id);
      }
    } catch {
      // ignore
    }

    return '';
  };

  const openQuotation = async (item, quote, autoPrint = false) => {
    setQuoteLoading(item.id);
    try {
      const quotationId = await resolveQuotationId(item, quote);
      let resolved = quote?._id && quote?.packageSnapshot ? quote : null;
      if (quotationId) {
        const { data } = await API.get(`/quotations/${quotationId}`, {
          skipSuccessToast: true,
          skipErrorToast: true,
        });
        resolved = data?.quotation || data || resolved || quote;
      }
      if (!resolved?._id) {
        toast.error('Is lead pe quotation PDF nahi hai. Pehle quotation create karein.');
        return;
      }
      setAutoPrintQuote(autoPrint);
      setPdfQuote(resolved);
    } catch {
      toast.error('Quotation PDF load nahi ho paya.');
    } finally {
      setQuoteLoading(null);
    }
  };

  const editQuotation = async (item, quote) => {
    if (!quoteEditPath || !leadId) {
      toast.error('Quotation edit available nahi hai.');
      return;
    }
    setQuoteLoading(item?.id || 'edit-bar');
    try {
      const quotationId = await resolveQuotationId(item, quote);
      if (quotationId) {
        navigate(`${quoteEditPath}?leadId=${leadId}&quoteId=${quotationId}`);
        return;
      }
      // Status was marked "quotation_sent" but no Quotation doc exists — open builder to create one.
      toast.info('Is lead pe saved quotation nahi mila — naya quotation open kar rahe hain.');
      navigate(`${quoteEditPath}?leadId=${leadId}`);
    } finally {
      setQuoteLoading(null);
    }
  };

  return (
    <>
      <div
        ref={timelineRef}
        id="activity-timeline"
        className={`${DETAIL_CARD} scroll-mt-24 overflow-hidden`}
      >
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Activity Timeline</h3>
          {showTimelineEditBar && (
            <Button
              type="button"
              size="sm"
              disabled={quoteLoading === 'edit-bar'}
              onClick={() => editQuotation({ id: 'edit-bar', type: 'quotation_sent', meta: {} }, quoteList[0])}
              className="rounded-lg h-8 gap-1.5 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white border-0 shadow-sm"
            >
              {quoteLoading === 'edit-bar'
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Pencil className="w-3.5 h-3.5" />}
              {editBarLabel}
            </Button>
          )}
        </div>
        <div className="p-5">
          {loading && (
            <p className="text-sm text-slate-400 text-center py-6">Loading timeline...</p>
          )}
          {!loading && sorted.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">No activity yet</p>
          )}
          {!loading && sorted.length > 0 && (
            <div className="relative pr-1">
              <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-violet-300 via-slate-200 to-transparent dark:from-violet-800 dark:via-slate-700" />
              <div className="space-y-1">
                {sorted.map((item, i) => {
                  const cfg = ACTIVITY_CONFIG[item.type] || ACTIVITY_CONFIG.status_changed;
                  const Icon = cfg.icon;
                  const { date, time } = formatActivityDate(item.date);
                  const isQuoteActivity = item.type?.startsWith('quotation_');
                  const quote = isQuoteActivity
                    ? findQuotationForActivity(item, quoteList)
                    : null;
                  const quotationId =
                    idOf(quote?._id || quote?.id) || idOf(item.meta?.quotationId);
                  const hasThisQuote = Boolean(quotationId || (isQuoteActivity && hasSavedQuote));
                  // View/Edit/PDF only when a real Quotation document exists.
                  // Status-only "Quotation Sent" (no PDF quote) gets Create instead.
                  const canOpenQuote = Boolean(isQuoteActivity && hasThisQuote);
                  const canEditQuote = Boolean(canOpenQuote && quoteEditPath && leadId);
                  const canCreateQuote = Boolean(
                    isQuoteActivity
                    && quoteEditPath
                    && leadId
                    && quotesLookupDone
                    && !hasThisQuote
                  );
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
                            {canOpenQuote && (
                              <>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={quoteLoading === item.id}
                                  onClick={() => openQuotation(item, quote, false)}
                                  className="rounded-lg h-7 gap-1 text-[11px] text-violet-700 border-violet-200 bg-violet-50 hover:bg-violet-100"
                                >
                                  {quoteLoading === item.id
                                    ? <Loader2 className="w-3 h-3 animate-spin" />
                                    : <Eye className="w-3 h-3" />}
                                  View
                                </Button>
                                {canEditQuote && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    disabled={quoteLoading === item.id}
                                    onClick={() => editQuotation(item, quote)}
                                    className="rounded-lg h-7 gap-1 text-[11px] font-semibold bg-sky-600 hover:bg-sky-700 text-white border-0 shadow-sm"
                                  >
                                    <Pencil className="w-3 h-3" /> Edit
                                  </Button>
                                )}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={quoteLoading === item.id}
                                  onClick={() => openQuotation(item, quote, true)}
                                  className="rounded-lg h-7 gap-1 text-[11px] text-violet-700 border-violet-200 bg-violet-50 hover:bg-violet-100"
                                >
                                  <Download className="w-3 h-3" /> PDF
                                </Button>
                              </>
                            )}
                            {canCreateQuote && (
                              <Button
                                type="button"
                                size="sm"
                                disabled={quoteLoading === item.id}
                                onClick={() => editQuotation(item, quote)}
                                className="rounded-lg h-7 gap-1 text-[11px] font-semibold bg-sky-600 hover:bg-sky-700 text-white border-0 shadow-sm"
                              >
                                <Pencil className="w-3 h-3" /> Create Quotation
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
        onClose={() => {
          setPdfQuote(null);
          setAutoPrintQuote(false);
        }}
        pdfRef={pdfRef}
        autoPrint={autoPrintQuote}
        onAutoPrintDone={() => setAutoPrintQuote(false)}
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
