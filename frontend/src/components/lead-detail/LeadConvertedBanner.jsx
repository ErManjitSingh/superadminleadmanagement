import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy, ExternalLink, Loader2, Calendar, Wallet, FileText, Eye, Download, MessageCircle, Mail,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getLeadBooking,
  downloadReceiptPdf,
  previewReceiptPdf,
  resendPaymentReceipt,
} from '../../services/bookingPaymentsApi';
import { formatINR, formatDate } from '../operations-manager/operationsUtils';
import { Button } from '../ui/button';
import API from '../../api/axios';
import { toast } from '../../context/ToastContext';

const OPS_ROLES = ['operations_manager', 'admin'];

export default function LeadConvertedBanner({ status, leadId }) {
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [advancePayment, setAdvancePayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const [resending, setResending] = useState(null);

  useEffect(() => {
    if (status !== 'converted' || !leadId) {
      setBooking(null);
      setAdvancePayment(null);
      return;
    }
    setLoading(true);
    getLeadBooking(leadId)
      .then((res) => {
        setBooking(res.booking);
        setAdvancePayment(res.advancePayment || null);
      })
      .catch(() => {
        setBooking(null);
        setAdvancePayment(null);
      })
      .finally(() => setLoading(false));
  }, [status, leadId]);

  useEffect(() => {
    if (!showPdf || !booking?._id || !advancePayment?._id) {
      setPdfUrl('');
      return undefined;
    }

    let objectUrl = '';
    setLoadingPdf(true);
    API.get(`/booking-payments/bookings/${booking._id}/payments/${advancePayment._id}/receipt`, {
      responseType: 'blob',
      skipSuccessToast: true,
    })
      .then((res) => {
        objectUrl = URL.createObjectURL(res.data);
        setPdfUrl(objectUrl);
      })
      .catch(() => {
        setPdfUrl('');
        toast.error('Advance voucher PDF load nahi ho paya.');
      })
      .finally(() => setLoadingPdf(false));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [showPdf, booking?._id, advancePayment?._id]);

  if (status !== 'converted') return null;

  const canOpenBooking = OPS_ROLES.includes(user?.role);
  const remaining = booking?.remainingBalance ?? booking?.pendingAmount ?? 0;
  const voucherSent = !!(advancePayment?.whatsappSentAt || advancePayment?.emailSentAt);

  const handleResend = async (channel) => {
    if (!booking?._id || !advancePayment?._id) return;
    setResending(channel);
    try {
      await resendPaymentReceipt(booking._id, advancePayment._id, channel);
      setAdvancePayment((prev) => prev && ({
        ...prev,
        ...(channel === 'whatsapp' || channel === 'both' ? { whatsappSentAt: new Date().toISOString() } : {}),
        ...(channel === 'email' || channel === 'both' ? { emailSentAt: new Date().toISOString() } : {}),
      }));
      toast.success(channel === 'email' ? 'Voucher email bhej diya.' : 'WhatsApp open ho gaya — voucher client ko bhejein.');
    } catch {
      toast.error('Voucher bhej nahi paye.');
    } finally {
      setResending(null);
    }
  };

  return (
    <div className="mb-6 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-slate-900/40 dark:border-emerald-800/40 overflow-hidden shadow-sm">
      <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2.5 rounded-xl bg-emerald-500 text-white shrink-0 shadow-lg shadow-emerald-500/25">
            <Trophy className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
              Converted! This lead has been successfully converted into a booking.
            </p>
            {loading ? (
              <p className="text-xs text-emerald-700/70 mt-2 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading booking details…
              </p>
            ) : booking ? (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <p className="text-emerald-700/70 font-semibold uppercase tracking-wide">Booking ID</p>
                  <p className="font-mono font-bold text-emerald-900 dark:text-emerald-100 mt-0.5">{booking.bookingNumber}</p>
                </div>
                <div>
                  <p className="text-emerald-700/70 font-semibold uppercase tracking-wide flex items-center gap-1"><Wallet className="w-3 h-3" /> Advance</p>
                  <p className="font-bold text-emerald-800 dark:text-emerald-200 mt-0.5 tabular-nums">{formatINR(booking.advanceReceived)}</p>
                </div>
                <div>
                  <p className="text-amber-700/80 font-semibold uppercase tracking-wide">Remaining</p>
                  <p className="font-bold text-amber-700 dark:text-amber-400 mt-0.5 tabular-nums">{formatINR(remaining)}</p>
                </div>
                <div>
                  <p className="text-emerald-700/70 font-semibold uppercase tracking-wide flex items-center gap-1"><Calendar className="w-3 h-3" /> Travel</p>
                  <p className="font-medium text-emerald-900 dark:text-emerald-100 mt-0.5">{formatDate(booking.travelDate)}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-1">
                Booking is being processed. Refresh if details do not appear.
              </p>
            )}
          </div>
        </div>

        {booking && canOpenBooking && (
          <Link
            to={`/operations-manager/booking/${booking._id}`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-lg shadow-emerald-600/20 transition-colors shrink-0"
          >
            Open Booking
            <ExternalLink className="w-4 h-4" />
          </Link>
        )}
      </div>

      {booking && advancePayment && (
        <div className="border-t border-emerald-200/70 dark:border-emerald-800/40 px-5 py-4 bg-white/50 dark:bg-slate-900/20">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700/80 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Advance Payment Voucher
              </p>
              <p className="text-sm font-semibold text-content-primary mt-1">
                Receipt <span className="font-mono">{advancePayment.receiptNumber}</span>
                <span className="text-content-muted font-normal"> · </span>
                <span className="tabular-nums text-emerald-700">{formatINR(advancePayment.amount)}</span>
                <span className="text-content-muted font-normal capitalize"> · {advancePayment.mode}</span>
              </p>
              <p className="text-xs text-content-muted mt-1">
                {voucherSent ? (
                  <>
                    Client ko bheja gaya
                    {advancePayment.whatsappSentAt ? ` · WhatsApp ${formatDate(advancePayment.whatsappSentAt)}` : ''}
                    {advancePayment.emailSentAt ? ` · Email ${formatDate(advancePayment.emailSentAt)}` : ''}
                  </>
                ) : (
                  'Voucher generate ho chuka hai — abhi client ko send nahi hua.'
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => setShowPdf((v) => !v)}
              >
                <Eye className="w-3.5 h-3.5 mr-1.5" />
                {showPdf ? 'Hide PDF' : 'View PDF'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => previewReceiptPdf(booking._id, advancePayment._id)}
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Open
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => downloadReceiptPdf(
                  booking._id,
                  advancePayment._id,
                  advancePayment.receiptFileName || `${advancePayment.receiptNumber}.pdf`,
                )}
              >
                <Download className="w-3.5 h-3.5 mr-1.5" /> Download
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={!!resending || !booking.customerPhone}
                onClick={() => handleResend('whatsapp')}
              >
                {resending === 'whatsapp' ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <MessageCircle className="w-3.5 h-3.5 mr-1.5" />}
                WhatsApp
              </Button>
              {booking.customerEmail && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                  disabled={!!resending}
                  onClick={() => handleResend('email')}
                >
                  {resending === 'email' ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Mail className="w-3.5 h-3.5 mr-1.5" />}
                  Email
                </Button>
              )}
            </div>
          </div>

          {showPdf && (
            <div className="mt-4 rounded-xl border border-emerald-200/80 overflow-hidden bg-slate-100 min-h-[360px] relative">
              {loadingPdf && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
                </div>
              )}
              {!loadingPdf && pdfUrl && (
                <iframe title="Advance voucher PDF" src={pdfUrl} className="w-full h-[420px] bg-white" />
              )}
              {!loadingPdf && !pdfUrl && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-content-muted">
                  PDF preview available nahi hai.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
