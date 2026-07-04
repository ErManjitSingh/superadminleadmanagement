import { toast } from '../../context/ToastContext';
import {
  buildQuotationWhatsAppMessage,
  isMobileDevice,
  sharePdfFileNative,
  shareQuotationWhatsApp,
} from '../../lib/whatsappContact';
import { uploadQuotationPdf } from '../../services/quotationsApi';
import { exportQuotationPdfBlob } from './exportQuotationPdf';

function queuePdfUpload(quotationId, savePath, blob) {
  if (!quotationId || !savePath || !blob) return;
  uploadQuotationPdf(quotationId, blob, savePath).catch((err) => {
    console.warn('PDF server save failed', err);
  });
}

async function resolveQuotationId(quotationId, ensureQuotationId) {
  if (quotationId) return quotationId;
  if (!ensureQuotationId) return null;
  try {
    return await ensureQuotationId();
  } catch (saveErr) {
    if (isMobileDevice()) {
      console.warn('Draft save skipped for share', saveErr);
      return null;
    }
    throw saveErr;
  }
}

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
  prebuiltBlob = null,
}) {
  if (!contentEl && !prebuiltBlob) {
    toast.error('Quotation preview not ready. Wait a few seconds and try again.');
    return false;
  }

  const fileName = `Quotation-${quoteNumber || 'draft'}.pdf`.replace(/[^\w.-]+/g, '_');
  const message = buildQuotationWhatsAppMessage({
    lead,
    packageName,
    destination,
    duration,
    total,
    quoteNumber,
    executiveName,
  });

  try {
    // Mobile: share PDF immediately while user-gesture is active (use pre-warmed blob).
    if (isMobileDevice() && prebuiltBlob?.size) {
      const nativeOk = await sharePdfFileNative(
        new File([prebuiltBlob], fileName, { type: 'application/pdf', lastModified: Date.now() }),
        message,
      );
      if (nativeOk) {
        toast.success('WhatsApp choose karein — PDF file attached dikhegi. Customer select karke Send dabayein.');
        resolveQuotationId(quotationId, ensureQuotationId).then((id) => {
          queuePdfUpload(id, savePath, prebuiltBlob);
        });
        return true;
      }
    }

    toast.info(prebuiltBlob?.size ? 'PDF share...' : 'Generating PDF…');
    const blob = prebuiltBlob?.size ? prebuiltBlob : await exportQuotationPdfBlob(contentEl);
    if (!blob?.size) {
      throw new Error('PDF empty');
    }

    const activeQuotationId = await resolveQuotationId(quotationId, ensureQuotationId);
    queuePdfUpload(activeQuotationId, savePath, blob);

    const result = await shareQuotationWhatsApp({
      phone,
      message,
      pdfBlob: blob,
      fileName,
    });

    if (result?.ok) {
      if (result.mode === 'native-share') {
        toast.success('WhatsApp choose karein — PDF attached hai. Customer select karke Send dabayein.');
      } else if (result.mode === 'download-manual') {
        toast.info(
          'PDF Downloads mein save hui. WhatsApp khula — clip (+) > Document > wahi PDF file attach karein, phir Send.',
        );
      } else {
        toast.success('PDF download ho gayi — WhatsApp mein attach (+) se PDF bhejein.');
      }
    }
    return Boolean(result?.ok);
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

/** Pre-generate PDF blob for faster WhatsApp file share on mobile. */
export async function warmQuotationPdfBlob(contentEl) {
  if (!contentEl) return null;
  try {
    const blob = await exportQuotationPdfBlob(contentEl);
    return blob?.size ? blob : null;
  } catch {
    return null;
  }
}
