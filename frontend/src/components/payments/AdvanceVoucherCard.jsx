import { useMemo, useState } from 'react';
import {
  Eye, Download, ExternalLink, FileText, Loader2, MessageCircle, Mail, Wallet,
} from 'lucide-react';
import { Button } from '../ui/button';
import { formatINR, formatDate } from '../operations-manager/operationsUtils';
import {
  previewReceiptPdf,
  downloadReceiptPdf,
  resendPaymentReceipt,
} from '../../services/bookingPaymentsApi';
import { toast } from '../../context/ToastContext';
import { cn } from '../../lib/utils';

/**
 * Prominent advance payment voucher card for ops (and shared lead/booking views).
 */
export default function AdvanceVoucherCard({
  bookingId,
  booking,
  payments = [],
  className,
  compact = false,
}) {
  const [busy, setBusy] = useState(null);

  const advancePayment = useMemo(() => {
    if (!payments?.length) return null;
    return (
      payments.find((p) => p.isFirstAdvance) ||
      payments.find((p) => p.paymentType === 'advance') ||
      (booking?.firstAdvancePaymentId
        ? payments.find((p) => String(p._id) === String(booking.firstAdvancePaymentId))
        : null) ||
      null
    );
  }, [payments, booking?.firstAdvancePaymentId]);

  const advanceAmount = Number(
    advancePayment?.amount ?? booking?.advanceReceived ?? 0
  ) || 0;

  if (!bookingId || (!advancePayment && advanceAmount <= 0)) return null;

  const receiptNo = advancePayment?.receiptNumber || '—';
  const voucherSent = !!(advancePayment?.whatsappSentAt || advancePayment?.emailSentAt);
  const fileName = advancePayment?.receiptFileName || `${receiptNo}.pdf`;

  const run = async (key, fn) => {
    if (!advancePayment?._id) {
      toast.error('Advance voucher abhi available nahi hai.');
      return;
    }
    setBusy(key);
    try {
      await fn();
    } catch (err) {
      toast.error(err?.message || 'Advance voucher open nahi ho paya.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      className={cn(
        'rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-teal-50/40 to-white',
        'dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-slate-900/40 dark:border-emerald-800/40',
        'overflow-hidden shadow-sm',
        className,
      )}
    >
      <div className={cn('flex flex-col sm:flex-row sm:items-center gap-3', compact ? 'p-3.5' : 'p-4 sm:p-5')}>
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2.5 rounded-xl bg-emerald-500 text-white shrink-0 shadow-lg shadow-emerald-500/20">
            <Wallet className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700/80 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Advance Payment Voucher
            </p>
            <p className="text-lg font-black text-emerald-900 dark:text-emerald-100 tabular-nums mt-0.5">
              {formatINR(advanceAmount)}
              <span className="ml-2 text-xs font-semibold text-content-muted capitalize">
                {advancePayment?.mode ? `· ${advancePayment.mode.replace(/_/g, ' ')}` : ''}
              </span>
            </p>
            <p className="text-xs text-content-muted mt-1">
              Receipt <span className="font-mono font-semibold text-content-secondary">{receiptNo}</span>
              {voucherSent ? (
                <>
                  {' · '}Client ko bheja gaya
                  {advancePayment.whatsappSentAt ? ` · WA ${formatDate(advancePayment.whatsappSentAt)}` : ''}
                  {advancePayment.emailSentAt ? ` · Email ${formatDate(advancePayment.emailSentAt)}` : ''}
                </>
              ) : (
                ' · Voucher generate ho chuka hai'
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <Button
            type="button"
            size="sm"
            className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            disabled={!!busy || !advancePayment?._id}
            onClick={() => run('view', () => previewReceiptPdf(bookingId, advancePayment._id))}
          >
            {busy === 'view' ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Eye className="w-3.5 h-3.5 mr-1.5" />}
            View Advance Voucher
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9"
            disabled={!!busy || !advancePayment?._id}
            onClick={() => run('dl', () => downloadReceiptPdf(bookingId, advancePayment._id, fileName))}
          >
            {busy === 'dl' ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Download className="w-3.5 h-3.5 mr-1.5" />}
            Download
          </Button>
          {!compact && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
                disabled={!!busy || !advancePayment?._id}
                onClick={() => run('open', () => previewReceiptPdf(bookingId, advancePayment._id))}
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Open
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
                disabled={!!busy || !advancePayment?._id || !booking?.customerPhone}
                onClick={() => run('wa', () => resendPaymentReceipt(bookingId, advancePayment._id, 'whatsapp'))}
              >
                {busy === 'wa' ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <MessageCircle className="w-3.5 h-3.5 mr-1.5" />}
                WhatsApp
              </Button>
              {booking?.customerEmail && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9"
                  disabled={!!busy || !advancePayment?._id}
                  onClick={() => run('email', () => resendPaymentReceipt(bookingId, advancePayment._id, 'email'))}
                >
                  {busy === 'email' ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Mail className="w-3.5 h-3.5 mr-1.5" />}
                  Email
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
