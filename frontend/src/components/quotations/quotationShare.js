import { toast } from '../../context/ToastContext';
import {
  buildQuotationWhatsAppMessage,
  buildPublicPdfUrl,
  shareQuotationWhatsApp,
} from '../../lib/whatsappContact';
import { uploadQuotationPdf } from '../../services/quotationsApi';
import { exportQuotationPdfBlob } from './exportQuotationPdf';

export async function shareQuotationWithPdf({
  contentEl,
  quotationId,
  savePath,
  phone,
  lead,
  packageName,
  destination,
  duration,
  total,
  quoteNumber,
  executiveName,
  shareUrl,
  existingPdfUrl = '',
}) {
  if (!contentEl) {
    toast.error('Quotation preview not ready. Wait a few seconds and try again.');
    return false;
  }

  toast.info('Generating PDF…');
  try {
    const blob = await exportQuotationPdfBlob(contentEl);
    const fileName = `Quotation-${quoteNumber || 'draft'}.pdf`.replace(/[^\w.-]+/g, '_');

    let publicPdfUrl = existingPdfUrl ? buildPublicPdfUrl(existingPdfUrl) : '';
    if (quotationId && savePath) {
      try {
        const uploaded = await uploadQuotationPdf(quotationId, blob, savePath);
        publicPdfUrl = uploaded.publicUrl || buildPublicPdfUrl(uploaded.pdfUrl);
      } catch (uploadErr) {
        console.warn('PDF upload failed', uploadErr);
        toast.info('PDF ready — sharing without server link.');
      }
    }

    const message = buildQuotationWhatsAppMessage({
      lead,
      packageName,
      destination,
      duration,
      total,
      quoteNumber,
      executiveName,
      shareUrl,
      pdfUrl: publicPdfUrl,
    });

    const shared = await shareQuotationWhatsApp({
      phone,
      message,
      pdfBlob: blob,
      fileName,
      pdfUrl: publicPdfUrl,
    });

    if (shared) {
      toast.success(
        publicPdfUrl
          ? 'PDF sent — WhatsApp opened with download link.'
          : 'PDF downloaded — WhatsApp opened. Attach the file in chat if needed.',
      );
    }
    return shared;
  } catch (err) {
    console.error('PDF share failed', err);
    const detail = String(err?.message || '');
    if (/canvas|exceed|memory|too large/i.test(detail)) {
      toast.error('PDF bahut bada hai. Pehle Preview PDF → Print/Save PDF try karein.');
    } else {
      toast.error('PDF send nahi ho paya. Download PDF try karein ya dubara attempt karein.');
    }
    return false;
  }
}
