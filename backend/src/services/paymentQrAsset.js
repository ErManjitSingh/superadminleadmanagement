const fs = require('fs');
const path = require('path');

const QR_CANDIDATES = [
  path.join(__dirname, '../assets/payment-qr.png'),
  path.join(__dirname, '../../assets/payment-qr.png'),
  path.join(__dirname, '../../frontend/public/payment-qr.png'),
];

let cachedPaymentQrDataUrl = null;

/** Explore My Bharat / company UPI QR as data URL for voucher PDFs. */
function getPaymentQrDataUrl() {
  if (cachedPaymentQrDataUrl) return cachedPaymentQrDataUrl;
  for (const filePath of QR_CANDIDATES) {
    try {
      if (!fs.existsSync(filePath)) continue;
      const buf = fs.readFileSync(filePath);
      cachedPaymentQrDataUrl = `data:image/png;base64,${buf.toString('base64')}`;
      return cachedPaymentQrDataUrl;
    } catch {
      /* try next */
    }
  }
  return '';
}

function paymentQrBlockHtml(label = 'Scan to Pay') {
  const src = getPaymentQrDataUrl();
  if (!src) return '';
  return `
  <div class="cv-pay-qr" style="margin:16px 0;padding:14px;border:1px solid #e2e8f0;border-radius:14px;background:#fff;text-align:center">
    <div style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#64748b;margin-bottom:8px">${label}</div>
    <img src="${src}" alt="Payment QR" style="width:148px;height:148px;object-fit:contain;margin:0 auto;display:block"/>
    <div style="margin-top:8px;font-size:11px;color:#334155;font-weight:600">UPI ID: exploremybharat01@okicici</div>
  </div>`;
}

module.exports = {
  getPaymentQrDataUrl,
  paymentQrBlockHtml,
};
