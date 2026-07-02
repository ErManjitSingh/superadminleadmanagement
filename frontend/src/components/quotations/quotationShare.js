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
    toast.error('Open PDF preview first, then try again.');
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
      } catch {
        /* share locally if upload fails */
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

    await shareQuotationWhatsApp({
      phone,
      message,
      pdfBlob: blob,
      fileName,
      pdfUrl: publicPdfUrl,
    });
    return true;
  } catch (err) {
    toast.error(err?.message || 'Could not generate PDF. Try Preview PDF first.');
    return false;
  }
}
