const fs = require('fs');
const path = require('path');
const { buildPaymentReceiptHtml } = require('./paymentReceiptHtmlTemplates');
const { renderVoucherHtmlToPdf } = require('./voucherHtmlPdfService');

const UPLOADS_ROOT = path.join(__dirname, '../../uploads');
const RECEIPT_DIR = path.join(UPLOADS_ROOT, 'receipts');

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

  const BookingPayment = require('../models/BookingPayment');
  const { resolveCompanyDocumentBranding } = require('./companyDocumentBrandingService');
  const paymentHistory = await BookingPayment.find({ booking: booking._id })
    .sort({ paymentDate: 1, createdAt: 1 })
    .lean();

  const companyBrand = await resolveCompanyDocumentBranding(
    booking.companyId || payment.companyId
  );

  // Backfill customer phone from lead when booking phone is empty
  let bookingForPdf = { ...booking };
  if ((!booking.customerPhone || !String(booking.customerPhone).trim()) && booking.lead) {
    try {
      const Lead = require('../models/Lead');
      const lead = await Lead.findById(booking.lead).select('phone whatsapp email assignedTo').lean();
      if (lead) {
        bookingForPdf = {
          ...bookingForPdf,
          customerPhone: lead.whatsapp || lead.phone || '',
          customerEmail: booking.customerEmail || lead.email || '',
          _leadAssignedTo: lead.assignedTo,
        };
      }
    } catch {
      /* ignore */
    }
  }

  // Sales executive phone for voucher PDFs
  try {
    const User = require('../models/User');
    const execId = payment.createdBy || bookingForPdf._leadAssignedTo || booking.assignedTo;
    if (execId) {
      const exec = await User.findById(execId).select('name phone email role').lean();
      if (exec) {
        bookingForPdf = {
          ...bookingForPdf,
          executiveName: booking.executiveName || exec.name || payment.createdByName || '',
          executivePhone: exec.phone || '',
        };
      }
    }
    if (!bookingForPdf.executivePhone && payment.createdByName) {
      bookingForPdf.executiveName = bookingForPdf.executiveName || payment.createdByName;
    }
  } catch {
    /* ignore */
  }

  const enrichedPayment = { ...payment, receiptNumber };
  const html = await buildPaymentReceiptHtml(enrichedPayment, bookingForPdf, paymentHistory, companyBrand);
  const result = await renderVoucherHtmlToPdf(html, fileName, RECEIPT_DIR);

  return {
    receiptNumber,
    fileName: result.fileName,
    filePath: result.filePath,
    pdfUrl: result.pdfUrl,
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
  RECEIPT_DIR,
};
