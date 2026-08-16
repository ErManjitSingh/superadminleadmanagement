const fs = require('fs');
const path = require('path');

const QR_CANDIDATES = [
  path.join(__dirname, '../assets/payment-qr.png'),
  path.join(__dirname, '../../assets/payment-qr.png'),
  path.join(process.cwd(), 'assets/payment-qr.png'),
  path.join(process.cwd(), 'backend/assets/payment-qr.png'),
  path.join(process.cwd(), 'frontend/public/payment-qr.png'),
];

const PAYMENT_UPI_ID = 'exploremybharat01@okicici';

let cachedPaymentQrDataUrl = null;

/** Explore My Bharat / company UPI QR as data URL for voucher PDFs. */
function getPaymentQrDataUrl() {
  if (cachedPaymentQrDataUrl) return cachedPaymentQrDataUrl;
  for (const filePath of QR_CANDIDATES) {
    try {
      if (!fs.existsSync(filePath)) continue;
      const buf = fs.readFileSync(filePath);
      if (!buf?.length) continue;
      cachedPaymentQrDataUrl = `data:image/png;base64,${buf.toString('base64')}`;
      return cachedPaymentQrDataUrl;
    } catch {
      /* try next */
    }
  }
  return '';
}

function paymentQrBlockHtml(label = 'Scan QR to Pay') {
  const src = getPaymentQrDataUrl();
  if (!src) return '';
  return `
  <div class="cv-pay-qr" style="margin:18px 0 8px;padding:16px 14px;border:1px solid #dbe3ef;border-radius:16px;background:#f8fafc;text-align:center;page-break-inside:avoid">
    <div style="font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#475569;margin-bottom:10px">${label}</div>
    <img src="${src}" alt="Payment QR" width="168" height="168" style="width:168px;height:168px;object-fit:contain;margin:0 auto;display:block;border-radius:10px;background:#fff;padding:6px;box-shadow:0 1px 4px rgba(15,23,42,.08)"/>
    <div style="margin-top:10px;font-size:12px;color:#0f172a;font-weight:700">UPI ID: ${PAYMENT_UPI_ID}</div>
    <div style="margin-top:4px;font-size:10px;color:#64748b">Explore My Bharat</div>
  </div>`;
}

module.exports = {
  PAYMENT_UPI_ID,
  getPaymentQrDataUrl,
  paymentQrBlockHtml,
};
