import { toast } from '../../context/ToastContext';
import {
  buildQuotationWhatsAppMessage,
  isMobileDevice,
  sharePdfFileNative,
  shareQuotationWhatsApp,
} from '../../lib/whatsappContact';
import { uploadQuotationPdf } from '../../services/quotationsApi';
import { exportQuotationPdfBlob, exportQuotationPdfForStorage } from './exportQuotationPdf';

/** Save compact optimized PDF on server (async, never blocks WhatsApp share). */
function queuePdfUpload(quotationId, savePath, contentEl, hdBlobFallback = null) {
  if (!quotationId || !savePath) return;

  const run = async () => {
    let storageBlob = null;
    if (contentEl) {
      try {
        storageBlob = await exportQuotationPdfForStorage(contentEl);
      } catch {
        /* fall back to HD blob only if compact render fails */
      }
    }
    const blob = storageBlob?.size ? storageBlob : hdBlobFallback;
    if (!blob?.size) return;
    await uploadQuotationPdf(quotationId, blob, savePath);
  };

  run().catch(() => {});
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
  toast.info(
    'PDF download ho gayi. WhatsApp chat open hai — 📎 Document se yahi PDF attach karke Send karein.'
  );
  return true;
}

/**
 * Generate HD quotation PDF for WhatsApp; store a compact optimized copy on the server.
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
    // Mobile: share HD immediately while user-gesture is active (pre-warmed HD PDF).
    if (isMobileDevice() && prebuiltBlob?.size) {
      const nativeOk = await sharePdfFileNative(
        new File([prebuiltBlob], fileName, { type: 'application/pdf', lastModified: Date.now() }),
        message,
      );
      if (nativeOk) {
        toast.success('WhatsApp choose karein — PDF document attached hai. Send dabayein.');
        resolveQuotationId(quotationId, ensureQuotationId).then((id) => {
          queuePdfUpload(id, savePath, contentEl, prebuiltBlob);
        });
        return true;
      }
    }

    toast.info(prebuiltBlob?.size ? 'PDF share…' : 'HD PDF bana rahe hain…');
    const blob = prebuiltBlob?.size ? prebuiltBlob : await exportQuotationPdfBlob(contentEl, 'hd');
    if (!blob?.size) throw new Error('PDF empty');

    const activeQuotationId = await resolveQuotationId(quotationId, ensureQuotationId);
    queuePdfUpload(activeQuotationId, savePath, contentEl, blob);

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

/** Pre-generate HD PDF blob so mobile share can attach a sharp file on tap. */
export async function warmQuotationPdfBlob(contentEl) {
  if (!contentEl) return null;
  try {
    const blob = await exportQuotationPdfBlob(contentEl, 'hd');
    return blob?.size ? blob : null;
  } catch {
    return null;
  }
}

/**
 * Share an already-built quote object: always prefer fresh HD from preview DOM for WhatsApp.
 * Server-saved PDF stays compact/optimized and is not reused for customer send.
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

  if (pdfRef?.current) {
    toast.info('HD PDF bana rahe hain…');
    pdfBlob = await exportQuotationPdfBlob(pdfRef.current, 'hd');
  }

  if (!pdfBlob?.size) {
    toast.error('PDF ready nahi hui. View PDF open karke phir WhatsApp try karein.');
    return false;
  }

  return shareQuotationWithPdf({
    contentEl: pdfRef?.current,
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
