import API from '../api/axios';

export const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'cheque', label: 'Cheque' },
];

export async function getConvertPreview(leadId) {
  const { data } = await API.get(`/booking-payments/leads/${leadId}/convert-preview`, { skipSuccessToast: true });
  return data;
}

export async function convertLeadWithPayment(leadId, payload) {
  const { data } = await API.post(`/booking-payments/leads/${leadId}/convert-with-payment`, payload);
  return data;
}

export async function getBookingPayments(bookingId) {
  const { data } = await API.get(`/booking-payments/bookings/${bookingId}/payments`, { skipSuccessToast: true });
  return data;
}

export async function addBookingPayment(bookingId, payload) {
  const { data } = await API.post(`/booking-payments/bookings/${bookingId}/payments`, payload);
  return data;
}

export async function resendPaymentReceipt(bookingId, paymentId, channel = 'both') {
  const { data } = await API.post(`/booking-payments/bookings/${bookingId}/payments/${paymentId}/resend`, { channel });
  const wa = data?.results?.whatsapp;
  if ((channel === 'whatsapp' || channel === 'both') && wa?.waMeUrl) {
    const { openWhatsAppWithPdf } = await import('../lib/shareWhatsAppPdf');
    await openWhatsAppWithPdf({
      waMeUrl: wa.waMeUrl,
      pdfBase64: wa.pdfBase64,
      fileName: wa.fileName || 'receipt.pdf',
      message: wa.message,
    });
  }
  return data;
}

export function getReceiptPdfUrl(bookingId, paymentId) {
  const base = import.meta.env.VITE_API_URL || '/api';
  return `${base}/booking-payments/bookings/${bookingId}/payments/${paymentId}/receipt`;
}

export async function fetchReceiptPdfBlob(bookingId, paymentId, { fresh = false } = {}) {
  const { data, headers } = await API.get(
    `/booking-payments/bookings/${bookingId}/payments/${paymentId}/receipt`,
    {
      params: fresh ? { fresh: 1 } : undefined,
      responseType: 'blob',
      skipSuccessToast: true,
      skipErrorToast: true,
    },
  );

  const contentType = String(headers?.['content-type'] || data?.type || '');
  if (!contentType.includes('pdf') && data instanceof Blob) {
    const text = await data.text();
    let message = 'Receipt PDF not found';
    try {
      message = JSON.parse(text)?.message || message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  return data;
}

export async function downloadReceiptPdf(bookingId, paymentId, fileName = 'receipt.pdf') {
  const data = await fetchReceiptPdfBlob(bookingId, paymentId);
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export async function previewReceiptPdf(bookingId, paymentId) {
  // Open tab synchronously so popup blockers don't block after the await.
  const tab = window.open('about:blank', '_blank');
  try {
    const data = await fetchReceiptPdfBlob(bookingId, paymentId);
    const url = URL.createObjectURL(data);
    if (tab) {
      tab.location.href = url;
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    setTimeout(() => URL.revokeObjectURL(url), 120000);
  } catch (err) {
    if (tab) tab.close();
    throw err;
  }
}

export async function getPaymentsDashboard() {
  const { data } = await API.get('/booking-payments/dashboard', { skipSuccessToast: true });
  return data;
}

export async function getCustomerPayments(params = {}) {
  const { data } = await API.get('/booking-payments/customer-payments', { params, skipSuccessToast: true });
  return data;
}

export async function getLeadBooking(leadId) {
  const { data } = await API.get(`/booking-payments/leads/${leadId}/booking`, { skipSuccessToast: true });
  return data;
}

export async function sendPaymentReminder(bookingId, channels = ['email', 'whatsapp', 'notification']) {
  const { data } = await API.post(`/booking-payments/bookings/${bookingId}/send-reminder`, { channels });
  return data;
}

export async function acknowledgeNewBooking(bookingId, config = {}) {
  const { data } = await API.post(`/booking-payments/bookings/${bookingId}/acknowledge-new`, {}, config);
  return data;
}

export async function markBookingFullyPaid(bookingId) {
  const { data } = await API.post(`/booking-payments/bookings/${bookingId}/mark-fully-paid`);
  return data;
}
