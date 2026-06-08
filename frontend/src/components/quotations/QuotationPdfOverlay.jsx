import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Download, X } from 'lucide-react';
import { Button } from '../ui/button';
import QuotePdfPreview from './QuotePdfPreview';

export default function QuotationPdfOverlay({ quote, open, onClose, pdfRef }) {
  useEffect(() => {
    if (!open) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; };
  }, [open]);

  if (!open || !quote || typeof document === 'undefined') return null;

  const handlePrint = () => window.print();

  return createPortal(
    <div className="quotation-print-root fixed inset-0 z-[210] bg-slate-100 overflow-y-auto print:static print:inset-auto print:bg-white">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200 p-3 flex justify-between items-center print:hidden shadow-sm">
        <Button variant="outline" onClick={onClose} className="rounded-xl gap-2">
          <X className="w-4 h-4" /> Close
        </Button>
        <p className="text-sm font-medium text-slate-600 hidden sm:block">
          {quote.quoteNumber} — Print or Save as PDF
        </p>
        <Button onClick={handlePrint} className="rounded-xl gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0">
          <Download className="w-4 h-4" /> Print / Save PDF
        </Button>
      </div>
      <QuotePdfPreview ref={pdfRef} quote={quote} />
    </div>,
    document.body,
  );
}
