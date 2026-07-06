const QRCode = require('qrcode');
const branding = require('../config/branding');

const HERO_IMG = 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80';

function fmtINR(n) {
  if (n == null || Number.isNaN(Number(n))) return '-';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function modeLabel(mode) {
  const labels = {
    cash: 'Cash', upi: 'UPI', bank_transfer: 'Bank Transfer',
    credit_card: 'Credit Card', debit_card: 'Debit Card', cheque: 'Cheque', card: 'Card',
  };
  return labels[mode] || mode || '-';
}

const PRINT_CSS = `
@page { size: A4 portrait; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  width: 210mm; margin: 0; padding: 0;
  font-family: 'Segoe UI', system-ui, Arial, sans-serif; color: #0f172a; background: #fff;
  -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
}
.page { width: 210mm; min-height: 297mm; background: #fff; overflow: hidden; }
.header {
  background: linear-gradient(135deg, #5b21b6 0%, #4c1d95 100%);
  color: #fff; padding: 14px 18px 12px; position: relative;
}
.header-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
.brand-block { display: flex; align-items: center; gap: 10px; }
.logo {
  width: 38px; height: 38px; border-radius: 50%; background: #fff;
  display: flex; align-items: center; justify-content: center;
  color: #5b21b6; font-weight: 900; font-size: 16px;
}
.brand-name { font-size: 13px; font-weight: 800; }
.brand-tag { font-size: 9px; opacity: 0.88; }
.hero-wrap { display: flex; gap: 8px; align-items: flex-start; }
.hero-img { width: 80px; height: 62px; border-radius: 8px; object-fit: cover; border: 2px solid rgba(255,255,255,0.25); }
.thank-ribbon {
  background: #fff; color: #5b21b6; border-radius: 8px; padding: 6px 8px;
  font-size: 6px; font-weight: 800; text-align: center; line-height: 1.2; max-width: 58px;
}
.title { text-align: center; font-size: 17px; font-weight: 900; letter-spacing: 0.04em; margin: 8px 0 6px; }
.pills { display: flex; justify-content: center; gap: 6px; flex-wrap: wrap; }
.pill { background: #fff; color: #5b21b6; padding: 3px 10px; border-radius: 999px; font-size: 8px; font-weight: 800; }
.pill.outline { background: transparent; border: 1px solid #c4b5fd; color: #fff; }
.issued { text-align: center; font-size: 8px; opacity: 0.9; margin-top: 4px; }
.strip {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;
  background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 10px 14px;
}
.strip label { display: block; font-size: 7px; color: #64748b; font-weight: 700; text-transform: uppercase; }
.strip p { font-size: 9px; font-weight: 700; margin-top: 2px; line-height: 1.25; word-break: break-word; }
.main { display: grid; grid-template-columns: 1.45fr 1fr; gap: 10px; padding: 12px 14px; }
.card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; background: #fff; }
.card-title {
  font-size: 9px; color: #fff; background: #5b21b6; margin: -10px -10px 10px;
  padding: 8px 10px; border-radius: 10px 10px 0 0; font-weight: 800; text-transform: uppercase;
}
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.cell {
  border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 7px; display: flex; gap: 6px; align-items: flex-start;
}
.icon {
  width: 22px; height: 22px; border-radius: 50%; background: #f5f3ff; color: #5b21b6;
  display: flex; align-items: center; justify-content: center; font-size: 10px; flex-shrink: 0;
}
.cell label { display: block; font-size: 6px; color: #64748b; font-weight: 700; text-transform: uppercase; }
.cell p { font-size: 8px; font-weight: 700; margin-top: 2px; line-height: 1.25; word-break: break-word; }
.balance-row {
  display: flex; justify-content: space-between; padding: 6px 0;
  border-bottom: 1px solid #f1f5f9; font-size: 8px;
}
.balance-row:last-child { border-bottom: none; }
.balance-row span:first-child { color: #64748b; font-weight: 600; }
.balance-row span:last-child { font-weight: 800; }
.green { color: #059669; }
.red { color: #dc2626; }
.progress-wrap { margin-top: 8px; }
.progress-label { display: flex; justify-content: space-between; font-size: 7px; font-weight: 700; margin-bottom: 4px; }
.progress-bar { height: 8px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #5b21b6, #7c3aed); border-radius: 999px; }
.verify {
  margin: 0 14px 10px; display: grid; grid-template-columns: 1fr auto; gap: 10px;
  border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; align-items: center;
}
.note-title { font-size: 9px; font-weight: 800; color: #5b21b6; margin-bottom: 6px; text-transform: uppercase; }
.note-text { font-size: 8px; line-height: 1.4; color: #334155; }
.note-sign { font-size: 9px; font-style: italic; color: #5b21b6; margin-top: 8px; }
.qr-box { text-align: center; }
.qr-box img { width: 72px; height: 72px; border: 2px solid #5b21b6; border-radius: 8px; padding: 4px; background: #fff; }
.qr-box p { font-size: 6px; color: #64748b; margin-top: 4px; font-weight: 700; }
.auth-row {
  display: grid; grid-template-columns: 1fr auto 1fr; gap: 10px;
  padding: 0 14px 10px; align-items: end; background: #f5f3ff; margin: 0 14px 10px; border-radius: 10px;
}
.sign-line { border-top: 1px solid #94a3b8; padding-top: 4px; }
.sign-label { font-size: 7px; color: #64748b; }
.sign-name { font-size: 8px; font-weight: 800; margin-top: 2px; }
.stamp {
  width: 56px; height: 56px; border: 2px solid #5b21b6; border-radius: 50%;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: #5b21b6; font-size: 5px; font-weight: 800; text-align: center; line-height: 1.2;
}
.company { font-size: 7px; line-height: 1.35; }
.company strong { display: block; font-size: 8px; margin-bottom: 4px; }
.foot {
  background: #5b21b6; color: #fff; padding: 8px 14px; font-size: 7px;
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; text-align: center;
}
`;

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtIssued(d) {
  const dt = d ? new Date(d) : new Date();
  return `${fmtDate(dt)}, ${dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
}

function cell(icon, label, value) {
  return `<div class="cell"><div class="icon">${icon}</div><div><label>${esc(label)}</label><p>${esc(value || '-')}</p></div></div>`;
}

async function buildPaymentReceiptHtml(payment, booking) {
  const receiptNumber = payment.receiptNumber || 'RCP';
  const totalAmount = booking.totalAmount || 0;
  const totalPaid = booking.totalPaid ?? booking.advanceReceived ?? payment.amount;
  const remaining = Math.max(0, totalAmount - totalPaid);
  const progress = totalAmount > 0 ? Math.min(100, Math.round((totalPaid / totalAmount) * 100)) : 0;
  const guests = `${booking.adults || 0} Adults, ${booking.children || 0} Children`;
  const receivedBy = payment.createdByName
    || (payment.createdBy?.name ? `${payment.createdBy.name}` : '')
    || 'Accounts Team';
  const roleLabel = payment.createdByRole === 'sales_executive' ? 'Sales Executive'
    : payment.createdByRole === 'operations_manager' ? 'Operations'
    : payment.department === 'sales' ? 'Sales Executive' : 'Accounts';
  const verifyUrl = `${(branding.websiteUrl || '').replace(/\/$/, '')}/receipt/${receiptNumber}`;
  let qrSrc = '';
  try {
    qrSrc = await QRCode.toDataURL(verifyUrl, { width: 140, margin: 1 });
  } catch { /* optional */ }

  const phone = branding.supportPhone || '+91 1800 123 456';
  const email = branding.salesEmail || 'support@travelcrm.com';
  const site = (branding.websiteUrl || 'www.travelcrm.com').replace(/^https?:\/\//, '');

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><title>${esc(receiptNumber)}</title><style>${PRINT_CSS}</style></head><body>
<div class="page">
  <div class="header">
    <div class="header-top">
      <div class="brand-block">
        <div class="logo">T</div>
        <div><div class="brand-name">${esc(branding.brandName)}</div><div class="brand-tag">Journey Beyond Limits</div></div>
      </div>
      <div class="hero-wrap">
        <img class="hero-img" src="${HERO_IMG}" alt=""/>
        <div class="thank-ribbon">THANK YOU<br/>for choosing<br/>${esc(branding.brandName)}</div>
      </div>
    </div>
    <div class="title">PAYMENT RECEIPT</div>
    <div class="pills">
      <span class="pill">Receipt No: ${esc(receiptNumber)}</span>
      <span class="pill outline">Booking ID: ${esc(booking.bookingNumber)}</span>
    </div>
    <div class="issued">Issued On: ${fmtIssued(payment.paymentDate || payment.createdAt)}</div>
  </div>
  <div class="strip">
    <div><label>Customer</label><p>${esc(booking.customerName)}</p></div>
    <div><label>Destination</label><p>${esc(booking.destination)}</p></div>
    <div><label>Travel Dates</label><p>${fmtDate(booking.travelDate)} – ${fmtDate(booking.returnDate)}</p></div>
    <div><label>Guests</label><p>${guests}</p></div>
  </div>
  <div class="main">
    <div class="card">
      <div class="card-title">Payment Details</div>
      <div class="grid-2">
        ${cell('₹', 'Amount Received', fmtINR(payment.amount))}
        ${cell('◆', 'Payment Mode', modeLabel(payment.mode))}
        ${cell('▣', 'Payment Date', fmtDate(payment.paymentDate || payment.createdAt))}
        ${cell('#', 'Transaction ID', payment.transactionId || payment.referenceNumber || '-')}
        ${cell('▤', 'Received By', `${receivedBy} (${roleLabel})`)}
        ${cell('◎', 'Receipt No', receiptNumber)}
      </div>
    </div>
    <div class="card">
      <div class="card-title">Balance Summary</div>
      <div class="balance-row"><span>Package Cost</span><span>${fmtINR(totalAmount)}</span></div>
      <div class="balance-row"><span>Total Paid</span><span class="green">${fmtINR(totalPaid)}</span></div>
      <div class="balance-row"><span>Remaining Balance</span><span class="red">${fmtINR(remaining)}</span></div>
      <div class="progress-wrap">
        <div class="progress-label"><span>Payment Progress</span><span>${progress}%</span></div>
        <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
      </div>
    </div>
  </div>
  <div class="verify">
    <div>
      <div class="note-title">Payment Note</div>
      <div class="note-text">This is an advance / part payment towards your booking. Balance payment to be completed before travel date.</div>
      <div class="note-sign">Thank you! We look forward to serving you.</div>
    </div>
    <div class="qr-box">
      <div class="note-title">Scan to Verify</div>
      ${qrSrc ? `<img src="${qrSrc}" alt="QR"/>` : ''}
      <p>Verify receipt online</p>
    </div>
  </div>
  <div class="auth-row">
    <div>
      <div class="sign-line"><div class="sign-label">Authorized Signatory</div><div class="sign-name">${esc(branding.brandName)} Pvt. Ltd.</div></div>
    </div>
    <div class="stamp"><div>TRAVEL CRM</div><div>PVT. LTD.</div><div>AUTHORISED</div></div>
    <div class="company">
      <strong>${esc(branding.brandName)} Pvt. Ltd.</strong>
      123, Travel House, 2nd Floor, Rajbagh, Srinagar, J&amp;K - 190008<br/>
      GSTIN: 01AAECT1234A1Z5
    </div>
  </div>
  <div class="foot">
    <span>Phone: ${esc(phone)}</span>
    <span>Email: ${esc(email)}</span>
    <span>Web: ${esc(site)}</span>
    <span>Srinagar, Kashmir</span>
  </div>
</div>
</body></html>`;
}

module.exports = {
  buildPaymentReceiptHtml,
};
