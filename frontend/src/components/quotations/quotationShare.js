import { toast } from '../../context/ToastContext';
import {
  buildQuotationWhatsAppMessage,
  buildPublicPdfUrl,
  isMobileDevice,
  shareQuotationWhatsApp,
} from '../../lib/whatsappContact';
import { uploadQuotationPdf } from '../../services/quotationsApi';
import { exportQuotationPdfBlob } from './exportQuotationPdf';

export async function shareQuotationWithPdf({
  contentEl,
  quotationId,
  savePath,
  ensureQuotationId,
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

    let activeQuotationId = quotationId;
    if (!activeQuotationId && ensureQuotationId) {
      activeQuotationId = await ensureQuotationId();
    }

    let publicPdfUrl = existingPdfUrl ? buildPublicPdfUrl(existingPdfUrl) : '';
    if (activeQuotationId && savePath) {
      const uploaded = await uploadQuotationPdf(activeQuotationId, blob, savePath);
      publicPdfUrl = uploaded.publicUrl || buildPublicPdfUrl(uploaded.pdfUrl);
    } else if (isMobileDevice()) {
      toast.error('Quotation save nahi hui. Pehle lead + package select karein, phir try karein.');
      return false;
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
        isMobileDevice()
          ? publicPdfUrl
            ? 'WhatsApp khula — Send dabayein. Customer ko PDF link milega.'
            : 'WhatsApp khula — message bhejein.'
          : publicPdfUrl
            ? 'PDF downloaded + WhatsApp opened with customer link.'
            : 'PDF downloaded — attach it in WhatsApp chat.',
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
