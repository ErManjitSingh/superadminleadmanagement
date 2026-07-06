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
  return data;
}

export function getReceiptPdfUrl(bookingId, paymentId) {
  const base = import.meta.env.VITE_API_URL || '/api';
  return `${base}/booking-payments/bookings/${bookingId}/payments/${paymentId}/receipt`;
}

export async function downloadReceiptPdf(bookingId, paymentId, fileName = 'receipt.pdf') {
  const { data } = await API.get(`/booking-payments/bookings/${bookingId}/payments/${paymentId}/receipt`, {
    responseType: 'blob',
    skipSuccessToast: true,
  });
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export async function previewReceiptPdf(bookingId, paymentId) {
  const { data } = await API.get(`/booking-payments/bookings/${bookingId}/payments/${paymentId}/receipt`, {
    responseType: 'blob',
    skipSuccessToast: true,
  });
  const url = URL.createObjectURL(data);
  window.open(url, '_blank', 'noopener,noreferrer');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export async function getPaymentsDashboard() {
  const { data } = await API.get('/booking-payments/dashboard', { skipSuccessToast: true });
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
