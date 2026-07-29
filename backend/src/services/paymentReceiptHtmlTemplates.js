const branding = require('../config/branding');
const {
  SCENIC_HERO,
  esc,
  svgIcon,
  brandedTile,
  brandedHelpBox,
  wrapBrandedDocument,
} = require('./brandedDocShell');

function fmtINR(n) {
  if (n == null || Number.isNaN(Number(n))) return '-';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function pickPositiveAmount(...values) {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 0;
}

function modeLabel(mode) {
  const labels = {
    cash: 'Cash', upi: 'UPI', bank_transfer: 'Bank Transfer',
    credit_card: 'Credit Card', debit_card: 'Debit Card', cheque: 'Cheque', card: 'Card',
  };
  return labels[mode] || mode || '-';
}

function fmtDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtIssued(d) {
  const dt = d ? new Date(d) : new Date();
  return `${fmtDate(dt)}, ${dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
}

function buildPaymentHistoryRows(paymentHistory = [], currentReceiptNumber) {
  if (!paymentHistory.length) return '';
  const rows = paymentHistory.map((p, i) => {
    const isCurrent = p.receiptNumber === currentReceiptNumber;
    return `<tr class="${isCurrent ? 'current' : ''}">
      <td>${i + 1}</td>
      <td>${esc(p.receiptNumber || `PAY-${i + 1}`)}</td>
      <td>${fmtDate(p.paymentDate || p.createdAt)}</td>
      <td>${esc(modeLabel(p.mode))}</td>
      <td class="amt">${fmtINR(p.amount)}</td>
    </tr>`;
  }).join('');
  return `<div class="cv-history">
    <div class="cv-history-title">Payment History — All Installments</div>
    <table>
      <thead><tr><th>#</th><th>Receipt</th><th>Date</th><th>Mode</th><th class="amt">Amount</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

async function buildPaymentReceiptHtml(payment, booking, paymentHistory = [], companyBrand = null) {
  const brand = companyBrand || {
    name: branding.brandName,
    tagline: '',
    logoSrc: '',
    initials: (branding.brandName || 'C').slice(0, 1).toUpperCase(),
    phone: branding.supportPhone || '',
    email: branding.salesEmail || '',
    website: (branding.websiteUrl || '').replace(/^https?:\/\//, ''),
    websiteUrl: branding.websiteUrl || '',
    address: '',
    gst: '',
    stamp: [(branding.brandName || 'COMPANY').toUpperCase().slice(0, 18), 'TRAVEL WITH', 'CONFIDENCE'],
  };

  const receiptNumber = payment.receiptNumber || 'RCP';
  const isAdvance = !!payment.isFirstAdvance || payment.paymentType === 'advance';
  const thisPayment = pickPositiveAmount(payment.amount, payment.paidAmount) || Number(payment.amount) || 0;
  const totalAmount = pickPositiveAmount(
    booking.totalAmount,
    booking.packageCost,
    payment.packageCost,
  );
  const historyAdvance = paymentHistory.find((p) => p.isFirstAdvance)?.amount;
  const advanceReceived = pickPositiveAmount(
    booking.advanceReceived,
    historyAdvance,
    isAdvance ? thisPayment : 0,
    thisPayment,
  );
  const totalPaid = pickPositiveAmount(booking.totalPaid, booking.advanceReceived, thisPayment) || thisPayment;
  const remaining = Math.max(
    0,
    Number(booking.remainingBalance ?? booking.pendingAmount ?? (totalAmount - totalPaid)) || 0,
  );
  const progress = totalAmount > 0 ? Math.min(100, Math.round((totalPaid / totalAmount) * 100)) : 0;
  const guests = `${booking.adults || 0} Adults, ${booking.children || 0} Children`;
  const customerPhone = booking.customerPhone || booking.phone || payment.customerPhone || '-';
  const pickup = booking.pickup || booking.pickupLocation || '-';
  const drop = booking.drop || booking.dropLocation || '-';
  const receivedBy = payment.createdByName
    || (payment.createdBy?.name ? `${payment.createdBy.name}` : '')
    || booking.executiveName
    || 'Accounts Team';
  const executivePhone = booking.executivePhone || brand.phone || '';
  const executiveName = booking.executiveName || payment.createdByName || receivedBy;
  const roleLabel = payment.createdByRole === 'sales_executive' ? 'Sales Executive'
    : payment.createdByRole === 'operations_manager' ? 'Operations'
    : payment.department === 'sales' ? 'Sales Executive' : 'Accounts';
  const docTitle = isAdvance ? 'ADVANCE PAYMENT VOUCHER' : 'PAYMENT RECEIPT';
  const amountLabel = isAdvance ? 'Advance Received' : 'Amount Received';
  const footPhone = brand.phone || executivePhone || '-';

  const detailTiles = [
    brandedTile('rupee', amountLabel, fmtINR(thisPayment)),
    brandedTile('info', 'Payment Mode', modeLabel(payment.mode)),
    brandedTile('calendar', 'Payment Date', fmtDate(payment.paymentDate || payment.createdAt)),
    brandedTile('ticket', 'Transaction ID', payment.transactionId || payment.referenceNumber || '-'),
    brandedTile('user', 'Received By', `${receivedBy} (${roleLabel})`),
    brandedTile('ticket', 'Receipt No', receiptNumber),
    brandedTile('phone', 'Customer Phone', customerPhone),
    brandedTile('phone', 'Company / Exec Phone', executivePhone || footPhone || '-'),
    brandedTile('mail', 'Customer Email', booking.customerEmail || '-'),
    brandedTile('user', 'Sales Executive', executiveName),
    brandedTile('car', 'Pickup', pickup),
    brandedTile('map', 'Drop', drop),
  ].join('');

  const pills = [
    { icon: 'ticket', text: `Receipt No: ${receiptNumber}` },
    { icon: 'calendar', text: `Booking ID: ${booking.bookingNumber}` },
    { icon: 'clock', text: `Issued On: ${fmtIssued(payment.paymentDate || payment.createdAt)}` },
  ];
  if (isAdvance) pills.splice(2, 0, { icon: 'rupee', text: 'First Advance' });

  const bodyHtml = `
  <div class="cv-amount-banner">
    <div class="cv-amount-card package"><label>Package Cost</label><p>${fmtINR(totalAmount)}</p></div>
    <div class="cv-amount-card advance"><label>${isAdvance ? 'Advance Received' : 'Paid Now'} (${esc(modeLabel(payment.mode))})</label><p>${fmtINR(isAdvance ? advanceReceived || thisPayment : thisPayment)}</p></div>
    <div class="cv-amount-card remaining"><label>Remaining Balance</label><p>${fmtINR(remaining)}</p></div>
  </div>
  <div class="cv-body">
    <div class="cv-panel">
      <div class="cv-panel-title">${svgIcon('rupee')} Payment Details</div>
      <div class="cv-grid">${detailTiles}</div>
      <div class="cv-footnote">
        ${svgIcon('info')}
        <span>Package cost ${fmtINR(totalAmount)}. Advance received ${fmtINR(advanceReceived || thisPayment)}. Remaining balance ${fmtINR(remaining)} — please clear before travel. Travel dates: ${fmtDate(booking.travelDate)} – ${fmtDate(booking.returnDate)}.</span>
      </div>
    </div>
    <div>
      <div class="cv-panel" style="margin-bottom:12px">
        <div class="cv-panel-title">${svgIcon('check')} Balance Summary</div>
        <div class="cv-balance-row"><span>Total Package Cost</span><span>${fmtINR(totalAmount)}</span></div>
        <div class="cv-balance-row"><span>Advance Received</span><span class="cv-green">${fmtINR(advanceReceived || (isAdvance ? thisPayment : 0))}</span></div>
        <div class="cv-balance-row"><span>Total Paid Till Now</span><span class="cv-green">${fmtINR(totalPaid)}</span></div>
        <div class="cv-balance-row"><span>Remaining Balance</span><span class="cv-red">${fmtINR(remaining)}</span></div>
        <div class="cv-progress-wrap">
          <div class="cv-progress-label"><span>Payment Progress</span><span>${progress}%</span></div>
          <div class="cv-progress-bar"><div class="cv-progress-fill" style="width:${progress}%"></div></div>
        </div>
      </div>
      ${brandedHelpBox([
        ['Sales Executive', executivePhone || footPhone],
        ['Support', brand.phone || footPhone],
      ])}
    </div>
  </div>
  ${buildPaymentHistoryRows(paymentHistory, receiptNumber)}`;

  return wrapBrandedDocument({
    title: docTitle,
    brand,
    heroSrc: SCENIC_HERO,
    pills,
    stripItems: [
      { icon: 'user', label: 'Customer', value: booking.customerName },
      { icon: 'phone', label: 'Phone', value: customerPhone },
      { icon: 'map', label: 'Destination', value: booking.destination },
      { icon: 'car', label: 'Pickup', value: pickup },
      { icon: 'map', label: 'Drop', value: drop },
      { icon: 'users', label: 'Guests', value: guests },
    ],
    stripCols: 6,
    bodyHtml,
    thanksText: `Thank you for choosing ${brand.name}. Please keep this voucher for your records.`,
  });
}

module.exports = {
  buildPaymentReceiptHtml,
};
