/** Company UPI payment QR (Explore My Bharat) — used on quotation PDFs. */
export const PAYMENT_UPI_ID = 'exploremybharat01@okicici';

/** Public asset path that works with Vite base (/app/ in production). */
export function getPaymentQrSrc() {
  const base = import.meta.env.BASE_URL || '/';
  const normalized = base.endsWith('/') ? base : `${base}/`;
  return `${normalized}payment-qr.png`;
}
