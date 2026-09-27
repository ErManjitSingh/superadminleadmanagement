/** Same UCO BHIM QR used on advance payment vouchers — Explore My Bharat. */
import paymentQrPng from '../../assets/payment-qr.png';

export const PAYMENT_UPI_ID = 'exploremybharat@ucobank';
export const PAYMENT_UPI_NAME = 'Explore My Bharat';

/** Bundled asset (same file as backend advance-payment QR) so PDF export always embeds it. */
export function getPaymentQrSrc() {
  return paymentQrPng;
}
