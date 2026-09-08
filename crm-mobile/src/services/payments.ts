import { apiClient } from '@/src/lib/apiClient';

export type ConvertPreview = {
  customerName?: string;
  customerPhone?: string;
  phone?: string;
  whatsapp?: string;
  leadId?: string;
  leadNumber?: string;
  packageName?: string;
  destination?: string;
  travelDate?: string;
  returnDate?: string;
  travellers?: number;
  adults?: number;
  children?: number;
  totalPackageCost?: number;
  quotationId?: string;
  quotationNumber?: string;
  status?: string;
  hasBooking?: boolean;
};

export type ConvertResult = {
  booking?: { _id: string; bookingNumber?: string; totalAmount?: number; advanceReceived?: number };
  payment?: { _id: string; amount?: number; mode?: string; receiptFileName?: string };
  quotation?: { _id: string; quoteNumber?: string };
  alreadyConverted?: boolean;
  summary?: Record<string, unknown>;
};

export const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'cheque', label: 'Cheque' },
];

export async function fetchConvertPreview(leadId: string): Promise<ConvertPreview> {
  const { data } = await apiClient.get(`/booking-payments/leads/${leadId}/convert-preview`);
  return data;
}

export async function convertLeadWithPayment(
  leadId: string,
  payload: {
    amount: number;
    paymentDate?: string;
    mode: string;
    remarks?: string;
    aadhaarNumber: string;
    aadhaarPhotoBase64?: string;
    screenshotBase64?: string;
    sendReceipt?: boolean;
  }
): Promise<ConvertResult> {
  const { data } = await apiClient.post(
    `/booking-payments/leads/${leadId}/convert-with-payment`,
    payload
  );
  return data;
}

export async function fetchReceiptPdfBase64(bookingId: string, paymentId: string): Promise<string> {
  const res = await apiClient.get(
    `/booking-payments/bookings/${bookingId}/payments/${paymentId}/receipt`,
    { responseType: 'arraybuffer', params: { fresh: '1' } }
  );
  const bytes = new Uint8Array(res.data as ArrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  // btoa available in RN hermes
  return globalThis.btoa(binary);
}

export function buildAdvanceVoucherHtml(opts: {
  customerName: string;
  phone?: string;
  packageName?: string;
  destination?: string;
  bookingNumber?: string;
  amount: number;
  totalPackageCost?: number;
  mode: string;
  paymentDate: string;
  quotationNumber?: string;
}): string {
  const remaining = Math.max(0, (opts.totalPackageCost || 0) - opts.amount);
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;margin:0;padding:16px;background:#f1f5f9;color:#0f172a}
.paper{background:#fff;border-radius:16px;padding:20px;max-width:640px;margin:0 auto;border:1px solid #e2e8f0}
.brand{color:#7c3aed;font-size:22px;font-weight:900;margin:0}
.sub{color:#64748b;font-size:12px;margin-top:4px}
.h{margin:18px 0 8px;font-size:16px;font-weight:800}
.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:14px}
.k{color:#64748b;font-weight:600}.v{font-weight:800}
.total{margin-top:16px;background:#7c3aed;color:#fff;border-radius:14px;padding:14px;display:flex;justify-content:space-between}
.badge{display:inline-block;background:#dcfce7;color:#166534;font-weight:800;font-size:11px;padding:4px 8px;border-radius:999px;margin-top:8px}
</style></head><body>
<div class="paper">
  <p class="brand">Explore My Bharat</p>
  <div class="sub">Advance Payment Voucher</div>
  <div class="badge">PAID · ADVANCE</div>
  <div class="h">Booking details</div>
  <div class="row"><span class="k">Booking No</span><span class="v">${opts.bookingNumber || '—'}</span></div>
  <div class="row"><span class="k">Guest</span><span class="v">${opts.customerName}</span></div>
  <div class="row"><span class="k">Phone</span><span class="v">${opts.phone || '—'}</span></div>
  <div class="row"><span class="k">Package</span><span class="v">${opts.packageName || '—'}</span></div>
  <div class="row"><span class="k">Destination</span><span class="v">${opts.destination || '—'}</span></div>
  <div class="row"><span class="k">Quotation</span><span class="v">${opts.quotationNumber || '—'}</span></div>
  <div class="row"><span class="k">Payment mode</span><span class="v">${opts.mode}</span></div>
  <div class="row"><span class="k">Payment date</span><span class="v">${opts.paymentDate}</span></div>
  <div class="row"><span class="k">Package total</span><span class="v">₹${Number(opts.totalPackageCost || 0).toLocaleString('en-IN')}</span></div>
  <div class="row"><span class="k">Remaining</span><span class="v">₹${remaining.toLocaleString('en-IN')}</span></div>
  <div class="total"><span>Advance received</span><strong>₹${Number(opts.amount).toLocaleString('en-IN')}</strong></div>
</div>
</body></html>`;
}
