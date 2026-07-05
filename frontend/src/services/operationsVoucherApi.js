import API from '../api/axios';

export async function fetchVoucherAnalytics() {
  const { data } = await API.get('/operations-manager/vouchers/analytics', { skipSuccessToast: true });
  return data;
}

export async function fetchVouchers(params = {}) {
  const { data } = await API.get('/operations-manager/vouchers', { params, skipSuccessToast: true });
  return data;
}

export async function fetchBookingExecution(bookingId) {
  const { data } = await API.get(`/operations-manager/bookings/${bookingId}/execution`, { skipSuccessToast: true });
  return data;
}

export async function generateVoucher(bookingId, payload) {
  const { data } = await API.post(`/operations-manager/bookings/${bookingId}/vouchers/generate`, payload);
  return data;
}

export async function generateAllVouchers(bookingId) {
  const { data } = await API.post(`/operations-manager/bookings/${bookingId}/vouchers/generate-all`);
  return data;
}

export async function generateTravelKit(bookingId) {
  const { data } = await API.post(`/operations-manager/bookings/${bookingId}/travel-kit`);
  return data;
}

export async function regenerateVoucher(voucherId) {
  const { data } = await API.post(`/operations-manager/vouchers/${voucherId}/regenerate`);
  return data;
}

export async function sendVoucherEmail(voucherId, to) {
  const { data } = await API.post(`/operations-manager/vouchers/${voucherId}/send-email`, { to });
  return data;
}

function base64ToBlob(base64, mime) {
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export async function sendVoucherWhatsApp(voucherId, phone) {
  const { data } = await API.post(`/operations-manager/vouchers/${voucherId}/send-whatsapp`, { phone });

  if (data.pdfBase64 && typeof navigator !== 'undefined' && navigator.share) {
    try {
      const blob = base64ToBlob(data.pdfBase64, 'application/pdf');
      const file = new File([blob], data.fileName || 'voucher.pdf', { type: 'application/pdf' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: data.message });
        return data;
      }
    } catch {
      // fall through to wa.me
    }
  }

  if (data.waMeUrl) window.open(data.waMeUrl, '_blank');
  return data;
}

export function voucherDownloadUrl(voucherId) {
  const base = API.defaults.baseURL || '';
  return `${base}/operations-manager/vouchers/${voucherId}/download`;
}

export async function downloadVoucherPdf(voucherId, fileName = 'voucher.pdf') {
  const { data } = await API.get(`/operations-manager/vouchers/${voucherId}/download`, {
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

export async function fetchVendorConfirmation(token) {
  const { data } = await API.get(`/public/vendor-confirm/${token}`, { skipSuccessToast: true });
  return data;
}

export async function submitVendorConfirmation(token, action, notes) {
  const { data } = await API.post(`/public/vendor-confirm/${token}`, { action, notes });
  return data;
}
