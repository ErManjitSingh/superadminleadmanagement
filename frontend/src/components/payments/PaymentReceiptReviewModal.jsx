import { useEffect, useState } from 'react';
import { Eye, Loader2, MessageCircle, X } from 'lucide-react';
import AppModal from '../ui/AppModal';
import { Button } from '../ui/button';
import PaymentSummaryCard from './PaymentSummaryCard';
import { previewReceiptPdf, resendPaymentReceipt, fetchReceiptPdfBlob } from '../../services/bookingPaymentsApi';
import { toast } from '../../context/ToastContext';

export default function PaymentReceiptReviewModal({
  open,
  onClose,
  bookingId,
  paymentId,
  summary,
  customerName,
  customerPhone,
  receiptNumber,
  onDone,
}) {
  const [pdfUrl, setPdfUrl] = useState('');
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!open || !bookingId || !paymentId) {
      setPdfUrl('');
      setSent(false);
      return undefined;
    }

    let objectUrl = '';
    setLoadingPdf(true);
    fetchReceiptPdfBlob(bookingId, paymentId)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
      })
      .catch(() => {
        setPdfUrl('');
        toast.error('Payment voucher preview load nahi ho paya.');
      })
      .finally(() => setLoadingPdf(false));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, bookingId, paymentId]);

  const handleSendWhatsApp = async () => {
    if (!customerPhone) {
      toast.error('Customer ka phone number missing hai.');
      return;
    }
    setSending(true);
    try {
      await resendPaymentReceipt(bookingId, paymentId, 'whatsapp');
      setSent(true);
      toast.success('WhatsApp open ho gaya — voucher review karke client ko send karein.');
    } catch {
      toast.error('WhatsApp par voucher bhej nahi paye.');
    } finally {
      setSending(false);
    }
  };

  const handleDone = () => {
    if (!sent) {
      const ok = window.confirm(
        'Advance voucher abhi client ko nahi gaya. Bina bheje close karein?',
      );
      if (!ok) return;
      toast.error('Voucher client ko nahi gaya — lead detail se baad mein WhatsApp/Email se bhej sakte hain.');
    }
    onDone?.({ voucherSent: sent });
    onClose?.();
  };

  return (
    <AppModal open={open} onClose={handleDone} size="4xl" lockDismiss={sending}>
      <div className="p-6 sm:p-8 max-h-[92vh] overflow-y-auto">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">Advance Payment Voucher</p>
            <h2 className="text-2xl font-black text-content-primary tracking-tight">Review & Send to Client</h2>
            <p className="text-sm text-content-muted mt-1">
              Voucher check karein, phir WhatsApp se client ko bhejein. Yehi PDF lead aur operations booking mein save rahegi.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDone}
            className="rounded-xl p-2 text-content-muted hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid lg:grid-cols-[320px_1fr] gap-5">
          <div className="space-y-4">
            <PaymentSummaryCard summary={summary} />
            <div className="rounded-2xl border border-subtle bg-surface/80 p-4 text-sm space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-content-muted">Client</p>
              <p className="font-bold text-content-primary">{customerName || '—'}</p>
              <p className="text-content-secondary">{customerPhone || 'Phone number missing'}</p>
              {receiptNumber && (
                <p className="text-xs text-content-muted pt-1">Receipt: <span className="font-mono font-semibold">{receiptNumber}</span></p>
              )}
            </div>
            <div className="rounded-2xl border border-violet-200 bg-violet-50/80 p-4 text-xs text-violet-900 leading-relaxed">
              Voucher mein package cost, is payment ki details, saari payments ki history aur remaining balance clear dikhegi.
            </div>
          </div>

          <div className="rounded-2xl border border-subtle overflow-hidden bg-slate-100 min-h-[420px] flex flex-col">
            <div className="px-4 py-3 border-b border-subtle bg-white flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-content-primary">
                <Eye className="w-4 h-4 text-violet-600" /> Voucher Preview
              </div>
              {pdfUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => previewReceiptPdf(bookingId, paymentId)}
                  className="h-8"
                >
                  Open in new tab
                </Button>
              )}
            </div>
            <div className="flex-1 relative bg-slate-200">
              {loadingPdf && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                </div>
              )}
              {!loadingPdf && pdfUrl && (
                <iframe title="Payment voucher preview" src={pdfUrl} className="w-full h-full min-h-[420px] bg-white" />
              )}
              {!loadingPdf && !pdfUrl && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-content-muted px-6 text-center">
                  Voucher preview available nahi hai.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6 pt-4 border-t border-subtle">
          {sent ? (
            <Button onClick={handleDone} disabled={sending} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              Done
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={handleDone} disabled={sending}>
                Close without sending
              </Button>
              <Button
                onClick={handleSendWhatsApp}
                disabled={sending || !customerPhone || loadingPdf}
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MessageCircle className="w-4 h-4 mr-2" />}
                Send Voucher on WhatsApp
              </Button>
            </>
          )}
        </div>
      </div>
    </AppModal>
  );
}
