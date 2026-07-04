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
  uploadQuotationPdf(quotationId, blob, savePath).catch(() => {});
}

async function resolveQuotationId(quotationId, ensureQuotationId) {
  if (quotationId) return quotationId;
  if (!ensureQuotationId) return null;
  try {
    return await ensureQuotationId();
  } catch (saveErr) {
    if (isMobileDevice()) return null;
    throw saveErr;
  }
}

function showShareResult(result) {
  if (!result?.ok) {
    toast.error(result?.reason || 'PDF WhatsApp par nahi bhej paye.');
    return false;
  }
  if (result.mode === 'native-share') {
    toast.success('WhatsApp choose karein — PDF document attached hai. Send dabayein.');
    return true;
  }
  // Desktop / no file-share support: PDF downloaded, chat opened — user attaches manually.
  toast.info(
    'PDF download ho gayi. WhatsApp chat open hai — 📎 Document se yahi PDF attach karke Send karein.'
  );
  return true;
}

/**
 * Generate quotation PDF and share it as a file on WhatsApp (phone share sheet).
 */
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
  if (!phone) {
    toast.error('Customer phone number missing.');
    return false;
  }
  if (!contentEl && !prebuiltBlob?.size) {
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
    // Mobile: share immediately while user-gesture is active (pre-warmed PDF).
    if (isMobileDevice() && prebuiltBlob?.size) {
      const nativeOk = await sharePdfFileNative(
        new File([prebuiltBlob], fileName, { type: 'application/pdf', lastModified: Date.now() }),
        message,
      );
      if (nativeOk) {
        toast.success('WhatsApp choose karein — PDF document attached hai. Send dabayein.');
        resolveQuotationId(quotationId, ensureQuotationId).then((id) => {
          queuePdfUpload(id, savePath, prebuiltBlob);
        });
        return true;
      }
    }

    toast.info(prebuiltBlob?.size ? 'PDF share…' : 'PDF bana rahe hain…');
    const blob = prebuiltBlob?.size ? prebuiltBlob : await exportQuotationPdfBlob(contentEl);
    if (!blob?.size) throw new Error('PDF empty');

    const activeQuotationId = await resolveQuotationId(quotationId, ensureQuotationId);
    queuePdfUpload(activeQuotationId, savePath, blob);

    const result = await shareQuotationWhatsApp({
      phone,
      message,
      pdfBlob: blob,
      fileName,
    });
    return showShareResult(result);
  } catch (err) {
    console.error('PDF share failed', err);
    const detail = String(err?.response?.data?.message || err?.message || '');
    if (/canvas|exceed|memory|too large|security/i.test(detail)) {
      toast.error('PDF bahut bada hai. Preview PDF → Print/Save PDF try karein.');
    } else if (detail) {
      toast.error(`PDF share fail: ${detail.slice(0, 120)}`);
    } else {
      toast.error('PDF WhatsApp par nahi bhej paye. Dobara try karein.');
    }
    return false;
  }
}

/** Pre-generate PDF blob so mobile share can attach the file on tap. */
export async function warmQuotationPdfBlob(contentEl) {
  if (!contentEl) return null;
  try {
    const blob = await exportQuotationPdfBlob(contentEl);
    return blob?.size ? blob : null;
  } catch {
    return null;
  }
}

/**
 * Share an already-built quote object: render hidden preview → PDF → WhatsApp file share.
 */
export async function shareQuoteObjectOnWhatsApp({
  quote,
  pdfRef,
  phone,
  executiveName,
  savePath = '/quotations',
}) {
  if (!quote) {
    toast.error('Quotation not found.');
    return false;
  }
  const lead = quote.lead || {};
  const customerPhone = phone || lead.whatsapp || lead.phone;
  if (!customerPhone) {
    toast.error('Customer phone number missing.');
    return false;
  }

  let pdfBlob = null;

  // Prefer already-saved PDF if present.
  if (quote.pdfUrl) {
    try {
      const url = quote.pdfUrl.startsWith('http')
        ? quote.pdfUrl
        : `${window.location.origin}${quote.pdfUrl}`;
      const res = await fetch(url);
      if (res.ok) {
        const blob = await res.blob();
        if (blob?.size) pdfBlob = blob;
      }
    } catch {
      /* generate below */
    }
  }

  // Generate from on-screen / hidden preview DOM.
  if (!pdfBlob?.size && pdfRef?.current) {
    toast.info('PDF bana rahe hain…');
    pdfBlob = await exportQuotationPdfBlob(pdfRef.current);
  }

  if (!pdfBlob?.size) {
    toast.error('PDF ready nahi hui. View PDF open karke phir WhatsApp try karein.');
    return false;
  }

  return shareQuotationWithPdf({
    prebuiltBlob: pdfBlob,
    quotationId: quote._id,
    savePath,
    phone: customerPhone,
    lead,
    packageName: quote.package?.name || quote.packageSnapshot?.name || quote.packageInfo?.packageName,
    destination: lead.destination || quote.packageInfo?.destination,
    duration: quote.packageInfo?.duration || quote.packageSnapshot?.duration,
    total: quote.pricing?.total,
    quoteNumber: quote.quoteNumber,
    executiveName,
  });
}
