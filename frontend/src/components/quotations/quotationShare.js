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
    if (!blob?.size) {
      throw new Error('PDF empty');
    }
    const fileName = `Quotation-${quoteNumber || 'draft'}.pdf`.replace(/[^\w.-]+/g, '_');

    let activeQuotationId = quotationId;
    if (!activeQuotationId && ensureQuotationId) {
      activeQuotationId = await ensureQuotationId();
    }

    let publicPdfUrl = existingPdfUrl ? buildPublicPdfUrl(existingPdfUrl) : '';
    if (activeQuotationId && savePath) {
      try {
        const uploaded = await uploadQuotationPdf(activeQuotationId, blob, savePath);
        publicPdfUrl = uploaded.publicUrl || buildPublicPdfUrl(uploaded.pdfUrl);
      } catch (uploadErr) {
        console.warn('PDF upload failed', uploadErr);
        if (isMobileDevice() && !publicPdfUrl) {
          toast.info('PDF link upload fail — WhatsApp file share try ho raha hai.');
        }
      }
    } else if (isMobileDevice() && !publicPdfUrl) {
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
            : 'WhatsApp khula — PDF attach/share karein.'
          : publicPdfUrl
            ? 'PDF downloaded + WhatsApp opened with customer link.'
            : 'PDF downloaded — attach it in WhatsApp chat.',
      );
    }
    return shared;
  } catch (err) {
    console.error('PDF share failed', err);
    const detail = String(err?.response?.data?.message || err?.message || '');
    if (/canvas|exceed|memory|too large|security/i.test(detail)) {
      toast.error('PDF bahut bada hai. Preview PDF → Print/Save PDF try karein.');
    } else if (detail) {
      toast.error(`PDF share fail: ${detail.slice(0, 120)}`);
    } else {
      toast.error('PDF send nahi ho paya. Download PDF try karein ya dubara attempt karein.');
    }
    return false;
  }
}
