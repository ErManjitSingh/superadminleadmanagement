const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const branding = require('../config/branding');

const UPLOADS_ROOT = path.join(__dirname, '../../uploads');
const RECEIPT_DIR = path.join(UPLOADS_ROOT, 'receipts');

const BRAND_BLUE = '#4f46e5';
const BRAND_PURPLE = '#7c3aed';
const TEXT_DARK = '#0f172a';
const TEXT_MUTED = '#64748b';

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtINR(n) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function modeLabel(mode) {
  const labels = {
    cash: 'Cash',
    upi: 'UPI',
    bank_transfer: 'Bank Transfer',
    credit_card: 'Credit Card',
    debit_card: 'Debit Card',
    cheque: 'Cheque',
    card: 'Card',
  };
  return labels[mode] || mode || '—';
}

function writePdfToFile(doc, filePath) {
  return new Promise((resolve, reject) => {
    ensureDir(path.dirname(filePath));
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    doc.end();
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
    doc.on('error', reject);
  });
}

function drawHeader(doc, title, subtitle) {
  const w = doc.page.width;
  doc.save();
  doc.rect(0, 0, w, 110).fill(BRAND_BLUE);
  doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text(branding.brandName, 48, 36, { width: w - 96 });
  doc.fontSize(14).font('Helvetica').text(title, 48, 64, { width: w - 96 });
  if (subtitle) doc.fontSize(10).fillColor('#e0e7ff').text(subtitle, 48, 84, { width: w - 96 });
  doc.restore();
  doc.fillColor(TEXT_DARK);
  doc.y = 130;
}

function drawField(doc, label, value, x, y, width) {
  doc.fontSize(8).fillColor(TEXT_MUTED).font('Helvetica-Bold').text(label.toUpperCase(), x, y, { width });
  doc.fontSize(11).fillColor(TEXT_DARK).font('Helvetica-Bold').text(String(value || '—'), x, y + 12, { width });
}

function drawSectionTitle(doc, title) {
  doc.moveDown(0.5);
  const y = doc.y;
  doc.fontSize(10).fillColor(BRAND_PURPLE).font('Helvetica-Bold').text(title.toUpperCase(), 48, y);
  doc.moveTo(48, y + 14).lineTo(doc.page.width - 48, y + 14).strokeColor('#e2e8f0').lineWidth(1).stroke();
  doc.y = y + 24;
}

function drawFooter(doc) {
  const y = doc.page.height - 50;
  doc.fontSize(8).fillColor(TEXT_MUTED).font('Helvetica')
    .text(`Generated ${fmtDate(new Date())} · ${branding.brandName}`, 48, y, { align: 'center', width: doc.page.width - 96 });
}

async function nextReceiptNumber() {
  const BookingPayment = require('../models/BookingPayment');
  const year = new Date().getFullYear();
  const count = await BookingPayment.countDocuments({
    receiptNumber: new RegExp(`^RCP-${year}-`),
  });
  return `RCP-${year}-${String(count + 1).padStart(5, '0')}`;
}

async function generateReceiptPdf(payment, booking) {
  const receiptNumber = payment.receiptNumber || await nextReceiptNumber();
  const safeNum = receiptNumber.replace(/[^a-zA-Z0-9-_]/g, '_');
  const fileName = `${safeNum}.pdf`;
  const filePath = path.join(RECEIPT_DIR, fileName);

  const totalAmount = booking.totalAmount || 0;
  const totalPaid = booking.totalPaid ?? booking.advanceReceived ?? payment.amount;
  const remaining = Math.max(0, totalAmount - totalPaid);

  const doc = new PDFDocument({ size: 'A4', margin: 48 });
  drawHeader(
    doc,
    'Payment Receipt',
    `Receipt ${receiptNumber} · Booking ${booking.bookingNumber}`
  );

  const colW = (doc.page.width - 96) / 2;
  let rowY = doc.y;
  drawField(doc, 'Receipt Number', receiptNumber, 48, rowY, colW);
  drawField(doc, 'Booking ID', booking.bookingNumber, 48 + colW + 16, rowY, colW);
  rowY += 44;
  drawField(doc, 'Customer', booking.customerName, 48, rowY, colW);
  drawField(doc, 'Destination', booking.destination, 48 + colW + 16, rowY, colW);
  rowY += 44;
  drawField(doc, 'Travel Dates', `${fmtDate(booking.travelDate)} — ${fmtDate(booking.returnDate)}`, 48, rowY, colW * 2);
  doc.y = rowY + 52;

  drawSectionTitle(doc, 'Payment Details');

  rowY = doc.y;
  doc.save();
  doc.roundedRect(48, rowY, doc.page.width - 96, 72, 8).fill('#f0fdf4');
  doc.restore();
  drawField(doc, 'Amount Received', fmtINR(payment.amount), 64, rowY + 16, colW);
  drawField(doc, 'Payment Mode', modeLabel(payment.mode), 64 + colW + 16, rowY + 16, colW);
  drawField(doc, 'Transaction ID', payment.transactionId || '—', 64, rowY + 44, colW);
  drawField(doc, 'Payment Date', fmtDate(payment.paymentDate), 64 + colW + 16, rowY + 44, colW);
  doc.y = rowY + 88;

  drawSectionTitle(doc, 'Balance Summary');
  rowY = doc.y;
  drawField(doc, 'Package Cost', fmtINR(totalAmount), 48, rowY, colW);
  drawField(doc, 'Total Paid', fmtINR(totalPaid), 48 + colW + 16, rowY, colW);
  rowY += 44;
  drawField(doc, 'Remaining Balance', fmtINR(remaining), 48, rowY, colW);
  drawField(doc, 'Reference', payment.referenceNumber || '—', 48 + colW + 16, rowY, colW);
  doc.y = rowY + 56;

  const verifyUrl = `${(branding.websiteUrl || '').replace(/\/$/, '')}/receipt/${receiptNumber}`;
  try {
    const qrBuffer = await QRCode.toBuffer(verifyUrl, { width: 100, margin: 1 });
    doc.image(qrBuffer, doc.page.width - 148, doc.y, { width: 80, height: 80 });
    doc.fontSize(8).fillColor(TEXT_MUTED).text('Scan to verify', doc.page.width - 148, doc.y + 84, { width: 80, align: 'center' });
  } catch {
    doc.fontSize(8).fillColor(TEXT_MUTED).text(`Verify: ${receiptNumber}`, doc.page.width - 200, doc.y, { width: 152, align: 'right' });
  }

  const sigY = doc.page.height - 120;
  doc.moveTo(48, sigY).lineTo(220, sigY).strokeColor('#cbd5e1').stroke();
  doc.fontSize(9).fillColor(TEXT_MUTED).text('Authorized Signature', 48, sigY + 6);

  drawFooter(doc);

  await writePdfToFile(doc, filePath);

  return {
    receiptNumber,
    fileName,
    filePath,
    pdfUrl: `/uploads/receipts/${fileName}`,
  };
}

function readReceiptPdfBuffer(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath);
}

module.exports = {
  nextReceiptNumber,
  generateReceiptPdf,
  readReceiptPdfBuffer,
  fmtINR,
  modeLabel,
};
