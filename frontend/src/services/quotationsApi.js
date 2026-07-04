import API from '../api/axios';
import { buildListParams, unwrapPagination } from '../utils/apiHelpers';

/**
 * Resolve role-scoped quotation base path.
 * Admin uses /quotations; roles use /sales-executive/quotations etc.
 */
export function resolveQuotationBasePath(savePath = '/quotations') {
  return String(savePath || '/quotations').replace(/\/$/, '') || '/quotations';
}

export async function fetchQuotations(params = {}, endpoint = '/quotations') {
  const { data } = await API.get(endpoint, {
    params: buildListParams(params),
    skipSuccessToast: true,
  });
  return unwrapPagination(data);
}

export async function fetchQuotationStats(params = {}) {
  const { data } = await API.get('/quotations/stats', {
    params,
    skipSuccessToast: true,
  });
  return data;
}

export async function fetchQuotationPdfMeta(quotationId, savePath = '/quotations') {
  const base = resolveQuotationBasePath(savePath);
  const { data } = await API.get(`${base}/${quotationId}/pdf/meta`, {
    skipSuccessToast: true,
    skipErrorToast: true,
  });
  return data;
}

export async function regenerateQuotationPdf(quotationId, savePath = '/quotations') {
  const base = resolveQuotationBasePath(savePath);
  const { data } = await API.post(
    `${base}/${quotationId}/pdf/regenerate`,
    {},
    { skipSuccessToast: true }
  );
  return data;
}

export async function deleteQuotationPdf(quotationId, savePath = '/quotations') {
  const base = resolveQuotationBasePath(savePath);
  const { data } = await API.delete(`${base}/${quotationId}/pdf`, {
    skipSuccessToast: true,
  });
  return data;
}

/** Authenticated PDF blob download (company-scoped). */
export async function downloadQuotationPdfBlob(quotationId, savePath = '/quotations') {
  const base = resolveQuotationBasePath(savePath);
  const { data } = await API.get(`${base}/${quotationId}/pdf/download`, {
    responseType: 'blob',
    skipSuccessToast: true,
  });
  return data;
}

export async function previewQuotationPdfBlob(quotationId, savePath = '/quotations') {
  const base = resolveQuotationBasePath(savePath);
  const { data } = await API.get(`${base}/${quotationId}/pdf/preview`, {
    responseType: 'blob',
    skipSuccessToast: true,
  });
  return data;
}

export function openPdfBlobInNewTab(blob) {
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function triggerPdfBlobDownload(blob, fileName = 'quotation.pdf') {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Send the permanent quotation PDF document via server-side WhatsApp Business API.
 * Does NOT use WhatsApp Web / wa.me (browsers cannot attach PDFs there).
 */
export async function sendQuotationWhatsApp(quotationId, payload = {}, savePath = '/quotations') {
  const base = resolveQuotationBasePath(savePath);
  const { data } = await API.post(`${base}/${quotationId}/send-whatsapp`, payload, {
    skipSuccessToast: true,
    skipErrorToast: true,
  });
  return data;
}

/** Email the permanent quotation PDF as an attachment. */
export async function sendQuotationEmail(quotationId, payload = {}, savePath = '/quotations') {
  const base = resolveQuotationBasePath(savePath);
  const { data } = await API.post(`${base}/${quotationId}/send-email`, payload, {
    skipSuccessToast: true,
    skipErrorToast: true,
  });
  return data;
}

/** @deprecated Client upload no longer stores browser PDFs — triggers server regenerate. */
export async function uploadQuotationPdf(quotationId, _pdfBlob, savePath = '/quotations') {
  const base = resolveQuotationBasePath(savePath);
  const { data } = await API.post(
    `${base}/${quotationId}/pdf/regenerate`,
    {},
    { skipSuccessToast: true, skipErrorToast: true }
  );
  return data;
}

export function getApiErrorMessage(err, fallback = 'Request failed') {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    fallback
  );
}
