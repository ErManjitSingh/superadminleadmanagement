import { toast } from '../../context/ToastContext';
import {
  sendQuotationWhatsApp,
  sendQuotationEmail,
  regenerateQuotationPdf,
  downloadQuotationPdfBlob,
  previewQuotationPdfBlob,
  openPdfBlobInNewTab,
  triggerPdfBlobDownload,
  getApiErrorMessage,
} from '../../services/quotationsApi';

/**
 * Send quotation PDF via server-side WhatsApp Business API.
 * Requires company WhatsApp API credentials. Does not use WhatsApp Web.
 */
export async function shareQuotationWithPdf({
  quotationId,
  savePath = '/quotations',
  ensureQuotationId,
  phone,
}) {
  try {
    let activeId = quotationId;
    if (!activeId && ensureQuotationId) {
      activeId = await ensureQuotationId();
    }
    if (!activeId) {
      toast.error('Save the quotation first, then send on WhatsApp.');
      return false;
    }

    toast.info('Sending quotation PDF on WhatsApp…');
    const result = await sendQuotationWhatsApp(
      activeId,
      phone ? { phone } : {},
      savePath
    );

    toast.success(
      result?.message ||
        `Quotation PDF v${result?.pdfVersion || ''} sent on WhatsApp`.trim()
    );
    return true;
  } catch (err) {
    const detail = getApiErrorMessage(err, 'WhatsApp send failed');
    toast.error(detail);
    return false;
  }
}

export async function emailQuotationPdf({
  quotationId,
  savePath = '/quotations',
  ensureQuotationId,
  to,
  subject,
  message,
}) {
  try {
    let activeId = quotationId;
    if (!activeId && ensureQuotationId) {
      activeId = await ensureQuotationId();
    }
    if (!activeId) {
      toast.error('Save the quotation first, then send by email.');
      return false;
    }

    toast.info('Sending quotation PDF by email…');
    const result = await sendQuotationEmail(
      activeId,
      { to, subject, message },
      savePath
    );
    toast.success(result?.message || `Quotation PDF emailed to ${result?.to || 'customer'}`);
    return true;
  } catch (err) {
    toast.error(getApiErrorMessage(err, 'Email send failed'));
    return false;
  }
}

export async function previewServerQuotationPdf(quotationId, savePath = '/quotations') {
  const blob = await previewQuotationPdfBlob(quotationId, savePath);
  openPdfBlobInNewTab(blob);
  return blob;
}

export async function downloadServerQuotationPdf(quotationId, fileName, savePath = '/quotations') {
  const blob = await downloadQuotationPdfBlob(quotationId, savePath);
  triggerPdfBlobDownload(blob, fileName || 'quotation.pdf');
  return blob;
}

export async function regenerateServerQuotationPdf(quotationId, savePath = '/quotations') {
  return regenerateQuotationPdf(quotationId, savePath);
}

/** @deprecated Client-side warm cache no longer used for WhatsApp. */
export async function warmQuotationPdfBlob() {
  return null;
}
