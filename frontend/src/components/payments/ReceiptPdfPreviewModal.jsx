import { useEffect, useState } from 'react';
import { Download, ExternalLink, Loader2, X } from 'lucide-react';
import AppModal from '../ui/AppModal';
import { Button } from '../ui/button';
import { fetchReceiptPdfBlob, downloadReceiptPdf } from '../../services/bookingPaymentsApi';
import { toast } from '../../context/ToastContext';

export default function ReceiptPdfPreviewModal({
  open,
  onClose,
  bookingId,
  paymentId,
  title = 'Advance Payment Voucher',
  fileName = 'advance-voucher.pdf',
}) {
  const [pdfUrl, setPdfUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !bookingId || !paymentId) {
      setPdfUrl('');
      return undefined;
    }

    let objectUrl = '';
    let cancelled = false;
    setLoading(true);

    fetchReceiptPdfBlob(bookingId, paymentId, { fresh: true })
      .catch(() => fetchReceiptPdfBlob(bookingId, paymentId))
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
      })
      .catch(() => {
        if (cancelled) return;
        setPdfUrl('');
        toast.error('Advance voucher PDF load nahi ho paya.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, bookingId, paymentId]);

  const handleOpenTab = () => {
    if (!pdfUrl) return;
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <AppModal open={open} onClose={onClose} size="4xl">
      <div className="p-4 sm:p-6 max-h-[92vh] flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">Payment Voucher</p>
            <h2 className="text-xl font-black text-content-primary tracking-tight">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-content-muted hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" disabled={!pdfUrl || loading} onClick={handleOpenTab}>
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Open in new tab
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!bookingId || !paymentId || loading}
            onClick={() => downloadReceiptPdf(bookingId, paymentId, fileName)}
          >
            <Download className="w-3.5 h-3.5 mr-1.5" /> Download
          </Button>
        </div>

        <div className="relative rounded-2xl border border-subtle overflow-hidden bg-slate-100 min-h-[70vh] flex-1">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-100/80">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          )}
          {!loading && pdfUrl && (
            <iframe title={title} src={pdfUrl} className="w-full h-[70vh] bg-white" />
          )}
          {!loading && !pdfUrl && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-content-muted px-6 text-center">
              PDF preview available nahi hai. Download try karein.
            </div>
          )}
        </div>
      </div>
    </AppModal>
  );
}
