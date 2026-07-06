const fs = require('fs');
const path = require('path');
const Booking = require('../models/Booking');
const BookingPayment = require('../models/BookingPayment');
const BookingPaymentEvent = require('../models/BookingPaymentEvent');
const Lead = require('../models/Lead');
const User = require('../models/User');
const Payment = require('../models/Payment');
const { generateReceiptPdf, readReceiptPdfBuffer } = require('./paymentReceiptPdfService');
const { sendPaymentReceiptEmail, sendPaymentReceiptWhatsApp } = require('./paymentNotificationService');
const { logLeadActivity } = require('./leadActivityService');
const { notifyUser } = require('./notificationService');
const { invalidate: invalidateDashboardCache } = require('./dashboardCacheService');
const cacheService = require('./cacheService');
const { createBooking } = require('./operationsService');
const { pickQuotationForLead, ensureQuotationApproved } = require('./leadConversionService');

const SCREENSHOT_DIR = path.join(__dirname, '../../uploads/payment-screenshots');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function saveScreenshot(base64, receiptNumber) {
  if (!base64) return '';
  try {
    const buffer = Buffer.from(String(base64).replace(/^data:image\/\w+;base64,/, ''), 'base64');
    if (!buffer.length || buffer.length > 5 * 1024 * 1024) return '';
    ensureDir(SCREENSHOT_DIR);
    const fileName = `${receiptNumber.replace(/[^a-zA-Z0-9-_]/g, '_')}-screenshot.jpg`;
    const filePath = path.join(SCREENSHOT_DIR, fileName);
    fs.writeFileSync(filePath, buffer);
    return `/uploads/payment-screenshots/${fileName}`;
  } catch {
    return '';
  }
}

function computePaymentStatus(totalAmount, totalPaid, travelDate) {
  if (totalAmount <= 0) return 'pending';
  if (totalPaid >= totalAmount) return 'paid';
  if (totalPaid > 0) {
    if (travelDate && new Date(travelDate) < new Date() && totalPaid < totalAmount) return 'overdue';
    return 'partial';
  }
  if (travelDate && new Date(travelDate) < new Date()) return 'overdue';
  return 'pending';
}

function computeProgress(totalAmount, totalPaid) {
  if (!totalAmount || totalAmount <= 0) return 0;
  return Math.min(100, Math.round((totalPaid / totalAmount) * 100));
}

async function syncBookingPaymentTotals(bookingId) {
  const payments = await BookingPayment.find({ booking: bookingId }).lean();
  const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const booking = await Booking.findById(bookingId);
  if (!booking) return null;

  const totalAmount = booking.totalAmount || 0;
  const remaining = Math.max(0, totalAmount - totalPaid);
  const advancePayment = payments.find((p) => p.isFirstAdvance);
  const advanceReceived = advancePayment?.amount || payments[0]?.amount || 0;

  booking.totalPaid = totalPaid;
  booking.advanceReceived = advanceReceived;
  booking.pendingAmount = remaining;
  booking.remainingBalance = remaining;
  booking.paymentProgress = computeProgress(totalAmount, totalPaid);
  booking.paymentStatus = computePaymentStatus(totalAmount, totalPaid, booking.travelDate);
  booking.receiptIds = payments.map((p) => p._id);

  if (booking.paymentStatus === 'paid' && !['confirmed', 'in_progress', 'completed'].includes(booking.status)) {
    booking.status = 'confirmed';
  }

  await booking.save();
  return booking.toObject();
}

async function logPaymentEvent({
  bookingId,
  leadId,
  branchId,
  paymentId,
  type,
  title,
  description = '',
  actor,
  amount,
  paymentMode,
  meta = {},
}) {
  return BookingPaymentEvent.create({
    booking: bookingId,
    lead: leadId,
    branchId,
    payment: paymentId,
    type,
    title,
    description,
    actorId: actor?._id,
    actorName: actor?.name || 'System',
    actorRole: actor?.role || '',
    department: actor?.role === 'operations_manager' ? 'operations' : actor?.role === 'sales_executive' ? 'sales' : 'admin',
    amount,
    paymentMode,
    meta,
  });
}

async function pickOperationsManager(branchId) {
  const filter = { role: 'operations_manager', isActive: { $ne: false } };
  if (branchId) filter.branchId = branchId;
  const managers = await User.find(filter).select('_id name').lean();
  if (!managers.length) return null;
  const idx = managers.length === 1 ? 0 : Math.floor(Math.random() * managers.length);
  return managers[idx];
}

async function buildBookingPayloadFromLead(lead, quotation, paymentAmount) {
  const snap = quotation?.packageSnapshot || {};
  const totalAmount = quotation?.pricing?.total || quotation?.costing?.grandTotal || lead.budget || 0;
  const travelDate = lead.travelDate || null;
  let returnDate = lead.returnDate || null;
  if (travelDate && snap.duration && !returnDate) {
    returnDate = new Date(travelDate);
    returnDate.setDate(returnDate.getDate() + Number(snap.duration));
  }

  let executive = null;
  if (quotation?.createdByExecutive) {
    executive = await User.findById(quotation.createdByExecutive).select('name').lean();
  } else if (lead.assignedTo) {
    executive = await User.findById(lead.assignedTo).select('name').lean();
  }

  const { mapQuoteHotels, mapQuoteTransport, mapQuoteActivities, mapQuoteItinerary } = require('./operationsQuotationSyncService');

  return {
    branchId: lead.branchId,
    lead: lead._id,
    quotation: quotation?._id,
    customerName: lead.name,
    customerPhone: lead.phone || '',
    customerEmail: lead.email || '',
    destination: lead.destination || snap.destination || 'TBD',
    packageName: snap.name || snap.title || lead.packageName || '',
    travelDate,
    returnDate,
    adults: lead.adults || lead.travelers || lead.pax || 2,
    children: lead.children || 0,
    status: 'booking_received',
    paymentStatus: paymentAmount >= totalAmount && totalAmount > 0 ? 'paid' : paymentAmount > 0 ? 'partial' : 'pending',
    totalAmount,
    advanceReceived: paymentAmount,
    totalPaid: paymentAmount,
    pendingAmount: Math.max(0, totalAmount - paymentAmount),
    remainingBalance: Math.max(0, totalAmount - paymentAmount),
    paymentProgress: computeProgress(totalAmount, paymentAmount),
    quotationReference: quotation?.quoteNumber || '',
    executiveName: executive?.name || '',
    hotels: quotation ? mapQuoteHotels(quotation, travelDate) : [],
    transport: quotation ? mapQuoteTransport(quotation) : [],
    activities: quotation ? mapQuoteActivities(quotation) : [],
    itinerary: quotation ? mapQuoteItinerary(quotation, travelDate) : [],
    isNewBooking: true,
    operationsStatus: 'new',
    priority: 'high',
  };
}

async function processPaymentSideEffects(paymentRecord, booking, actor, { sendReceipt = true } = {}) {
  const receipt = await generateReceiptPdf(paymentRecord, booking);
  await BookingPayment.findByIdAndUpdate(paymentRecord._id, {
    receiptNumber: receipt.receiptNumber,
    receiptPdfUrl: receipt.pdfUrl,
    receiptPdfPath: receipt.filePath,
    receiptFileName: receipt.fileName,
  });

  await logPaymentEvent({
    bookingId: booking._id,
    leadId: booking.lead,
    branchId: booking.branchId,
    paymentId: paymentRecord._id,
    type: 'receipt_generated',
    title: 'Receipt Generated',
    description: `Receipt ${receipt.receiptNumber} generated`,
    actor,
    amount: paymentRecord.amount,
    paymentMode: paymentRecord.mode,
  });

  if (sendReceipt) {
    const updatedPayment = await BookingPayment.findById(paymentRecord._id).lean();
    const emailResult = await sendPaymentReceiptEmail(updatedPayment, booking, actor).catch((err) => {
      console.error('[PaymentEmail]', err.message);
      return { sent: false };
    });
    if (emailResult?.sent) {
      await BookingPayment.findByIdAndUpdate(paymentRecord._id, { emailSentAt: new Date() });
      await logPaymentEvent({
        bookingId: booking._id,
        leadId: booking.lead,
        branchId: booking.branchId,
        paymentId: paymentRecord._id,
        type: 'email_sent',
        title: 'Receipt Email Sent',
        description: `Receipt sent to ${booking.customerEmail}`,
        actor,
        amount: paymentRecord.amount,
        paymentMode: paymentRecord.mode,
      });
    }

    const waResult = await sendPaymentReceiptWhatsApp(updatedPayment, booking, actor).catch((err) => {
      console.error('[PaymentWhatsApp]', err.message);
      return { sent: false };
    });
    if (waResult?.sent || waResult?.prepared) {
      await BookingPayment.findByIdAndUpdate(paymentRecord._id, { whatsappSentAt: new Date() });
      await logPaymentEvent({
        bookingId: booking._id,
        leadId: booking.lead,
        branchId: booking.branchId,
        paymentId: paymentRecord._id,
        type: 'whatsapp_sent',
        title: 'Receipt WhatsApp Sent',
        description: `Receipt sent to ${booking.customerPhone}`,
        actor,
        amount: paymentRecord.amount,
        paymentMode: paymentRecord.mode,
      });

      if (booking.lead) {
        await logLeadActivity({
          leadId: booking.lead,
          branchId: booking.branchId,
          type: 'whatsapp_sent',
          description: `Payment receipt sent via WhatsApp — ${receipt.receiptNumber}`,
          actor,
          meta: { paymentId: paymentRecord._id, receiptNumber: receipt.receiptNumber },
        });
      }
    }
  }

  return receipt;
}

async function recordBookingPayment(bookingId, data, actor, { isFirstAdvance = false, sendReceipt = true } = {}) {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new Error('Booking not found');

  if (isFirstAdvance) {
    const existing = await BookingPayment.findOne({ booking: bookingId, isFirstAdvance: true });
    if (existing) throw new Error('First advance payment already recorded');
  } else if (actor?.role === 'sales_executive') {
    throw new Error('Sales executives can only collect the first advance payment during lead conversion');
  }

  const { nextReceiptNumber } = require('./paymentReceiptPdfService');
  const receiptNumber = await nextReceiptNumber();
  const screenshotUrl = saveScreenshot(data.screenshotBase64, receiptNumber);

  const department = isFirstAdvance ? 'sales' : actor?.role === 'operations_manager' ? 'operations' : 'admin';
  const totalPaidSoFar = (await BookingPayment.find({ booking: bookingId }).lean())
    .reduce((s, p) => s + (p.amount || 0), 0);
  const willBeFullyPaid = totalPaidSoFar + Number(data.amount) >= (booking.totalAmount || 0);

  const paymentRecord = await BookingPayment.create({
    receiptNumber,
    booking: bookingId,
    lead: booking.lead,
    branchId: booking.branchId,
    customerName: booking.customerName,
    amount: Number(data.amount),
    paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
    mode: data.mode || data.paymentMode || 'upi',
    transactionId: data.transactionId || '',
    referenceNumber: data.referenceNumber || '',
    bankName: data.bankName || '',
    remarks: data.remarks || '',
    screenshotUrl,
    paymentType: isFirstAdvance ? 'advance' : willBeFullyPaid ? 'final' : 'installment',
    isFirstAdvance,
    department,
    isLocked: isFirstAdvance,
    createdBy: actor?._id,
    createdByRole: actor?.role || '',
    createdByName: actor?.name || '',
  });

  const syncedBooking = await syncBookingPaymentTotals(bookingId);

  await logPaymentEvent({
    bookingId,
    leadId: booking.lead,
    branchId: booking.branchId,
    paymentId: paymentRecord._id,
    type: isFirstAdvance ? 'advance_payment' : 'payment_received',
    title: isFirstAdvance ? 'Advance Payment Received' : 'Payment Received',
    description: `${department} collected ${data.amount}`,
    actor,
    amount: paymentRecord.amount,
    paymentMode: paymentRecord.mode,
  });

  if (booking.lead) {
    await logLeadActivity({
      leadId: booking.lead,
      branchId: booking.branchId,
      type: isFirstAdvance ? 'advance_payment_received' : 'payment_received',
      description: `Payment of ₹${paymentRecord.amount} received (${paymentRecord.mode})`,
      actor,
      meta: { paymentId: paymentRecord._id, amount: paymentRecord.amount, bookingId },
    });
  }

  await processPaymentSideEffects(paymentRecord, syncedBooking, actor, { sendReceipt });

  if (syncedBooking.paymentStatus === 'paid') {
    await logPaymentEvent({
      bookingId,
      leadId: booking.lead,
      branchId: booking.branchId,
      type: 'booking_fully_paid',
      title: 'Booking Fully Paid',
      description: 'All payments received',
      actor,
      amount: syncedBooking.totalPaid,
    });
  }

  invalidateDashboards();
  return { payment: await BookingPayment.findById(paymentRecord._id).lean(), booking: syncedBooking };
}

async function convertLeadWithAdvancePayment(leadId, paymentData, actor) {
  const lead = await Lead.findById(leadId);
  if (!lead) throw new Error('Lead not found');
  if (lead.status === 'converted') {
    const existingBooking = await Booking.findOne({ lead: leadId });
    if (existingBooking) return { booking: existingBooking, alreadyConverted: true };
  }

  const amount = Number(paymentData.amount);
  if (!amount || amount <= 0) throw new Error('Advance amount is required');

  let quotation = await pickQuotationForLead(leadId);
  quotation = await ensureQuotationApproved(quotation, actor);

  const totalAmount = quotation?.pricing?.total || quotation?.costing?.grandTotal || lead.budget || 0;
  if (totalAmount > 0 && amount > totalAmount) throw new Error('Advance amount cannot exceed package cost');

  const opsManager = await pickOperationsManager(lead.branchId);
  const payload = await buildBookingPayloadFromLead(lead, quotation, amount);
  payload.assignedTo = opsManager?._id || actor?._id;
  payload.operationsManagerId = opsManager?._id;
  payload.createdBy = actor?._id;

  if (totalAmount > 0 && (!lead.budget || lead.budget < totalAmount)) {
    await Lead.findByIdAndUpdate(leadId, { budget: totalAmount });
  }

  lead.status = 'converted';
  await lead.save();

  await logLeadActivity({
    leadId: lead._id,
    branchId: lead.branchId,
    type: 'lead_converted',
    description: 'Lead converted to booking with advance payment',
    actor,
    meta: { advanceAmount: amount },
  });

  await logPaymentEvent({
    leadId: lead._id,
    branchId: lead.branchId,
    type: 'lead_converted',
    title: 'Lead Converted',
    description: `${lead.name} converted with advance payment`,
    actor,
    amount,
    paymentMode: paymentData.mode,
  });

  const booking = await createBooking(payload, actor);

  await logPaymentEvent({
    bookingId: booking._id,
    leadId: lead._id,
    branchId: lead.branchId,
    type: 'booking_created',
    title: 'Booking Created',
    description: `Booking ${booking.bookingNumber} created`,
    actor,
    amount,
  });

  if (opsManager) {
    await Booking.findByIdAndUpdate(booking._id, {
      assignedTo: opsManager._id,
      operationsManagerId: opsManager._id,
    });
    await logPaymentEvent({
      bookingId: booking._id,
      leadId: lead._id,
      branchId: lead.branchId,
      type: 'operations_assigned',
      title: 'Operations Assigned',
      description: `Assigned to ${opsManager.name}`,
      actor,
      meta: { operationsManagerId: opsManager._id },
    });
    notifyUser(opsManager._id, {
      type: 'operations_task',
      title: 'NEW BOOKING',
      message: `${lead.name} — ${lead.destination} (${booking.bookingNumber})`,
      branchId: lead.branchId,
      meta: { bookingId: booking._id, leadId: lead._id, isNewBooking: true },
    }).catch(() => {});
  }

  const invoiceCount = await Payment.countDocuments();
  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(4, '0')}`;
  await Payment.create({
    invoiceNumber,
    branchId: lead.branchId,
    lead: lead._id,
    quotation: quotation?._id,
    booking: booking._id,
    customerName: lead.name,
    amount: totalAmount,
    paidAmount: amount,
    status: amount >= totalAmount && totalAmount > 0 ? 'paid' : 'partial',
    method: paymentData.mode || 'upi',
    paidAt: new Date(),
    createdBy: actor?._id,
  });

  booking.firstAdvancePaymentId = null;
  await booking.save();

  const result = await recordBookingPayment(
    booking._id,
    { ...paymentData, amount },
    actor,
    { isFirstAdvance: true, sendReceipt: paymentData.sendReceipt !== false }
  );

  await Booking.findByIdAndUpdate(booking._id, {
    firstAdvancePaymentId: result.payment._id,
  });

  invalidateDashboards();
  return { booking: result.booking, payment: result.payment, quotation };
}

async function listBookingPayments(bookingId) {
  return BookingPayment.find({ booking: bookingId })
    .populate('createdBy', 'name email role')
    .sort({ paymentDate: -1, createdAt: -1 })
    .lean();
}

async function getPaymentTimeline(bookingId) {
  return BookingPaymentEvent.find({ booking: bookingId })
    .sort({ createdAt: -1 })
    .lean();
}

async function resendReceipt(paymentId, actor, { channel = 'both' } = {}) {
  const payment = await BookingPayment.findById(paymentId).lean();
  if (!payment) throw new Error('Payment not found');
  const booking = await Booking.findById(payment.booking).lean();
  if (!booking) throw new Error('Booking not found');

  const results = {};
  if (channel === 'both' || channel === 'email') {
    results.email = await sendPaymentReceiptEmail(payment, booking, actor);
    if (results.email?.sent) {
      await BookingPayment.findByIdAndUpdate(paymentId, { emailSentAt: new Date() });
    }
  }
  if (channel === 'both' || channel === 'whatsapp') {
    results.whatsapp = await sendPaymentReceiptWhatsApp(payment, booking, actor);
    if (results.whatsapp?.sent || results.whatsapp?.prepared) {
      await BookingPayment.findByIdAndUpdate(paymentId, { whatsappSentAt: new Date() });
    }
  }

  await logPaymentEvent({
    bookingId: booking._id,
    leadId: booking.lead,
    branchId: booking.branchId,
    paymentId,
    type: 'receipt_resent',
    title: 'Receipt Resent',
    description: `Receipt resent via ${channel}`,
    actor,
    amount: payment.amount,
    paymentMode: payment.mode,
  });

  return results;
}

function getReceiptPdfBuffer(payment) {
  if (payment.receiptPdfPath) {
    return readReceiptPdfBuffer(payment.receiptPdfPath);
  }
  return null;
}

function invalidateDashboards() {
  ['admin', 'sales_manager', 'team_leader', 'sales_executive', 'operations_manager', 'accountant', 'nav:'].forEach((k) => {
    invalidateDashboardCache(k);
  });
  cacheService.invalidate('ops:').catch(() => {});
}

async function buildPaymentDashboardStats(branchId) {
  const { withBranch } = require('../utils/branchScope');
  const { startOfDay, endOfDay } = require('../utils/queryHelpers');
  const base = withBranch({}, branchId);
  const todayStart = startOfDay();
  const todayEnd = endOfDay();
  const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);

  const [todayPayments, monthPayments, allPayments, bookings] = await Promise.all([
    BookingPayment.find({ ...base, paymentDate: { $gte: todayStart, $lte: todayEnd } }).lean(),
    BookingPayment.find({ ...base, paymentDate: { $gte: monthStart } }).lean(),
    BookingPayment.find(base).lean(),
    Booking.find({ ...base, archivedAt: { $exists: false } }).lean(),
  ]);

  const sum = (arr) => arr.reduce((s, p) => s + (p.amount || 0), 0);
  const todayCollection = sum(todayPayments);
  const monthCollection = sum(monthPayments);

  const outstanding = bookings.reduce((s, b) => s + Math.max(0, (b.totalAmount || 0) - (b.totalPaid || b.advanceReceived || 0)), 0);
  const pendingBookings = bookings.filter((b) => ['pending', 'partial', 'overdue'].includes(b.paymentStatus));
  const fullyPaid = bookings.filter((b) => b.paymentStatus === 'paid').length;

  const upcomingDue = bookings
    .filter((b) => b.paymentStatus !== 'paid' && b.travelDate)
    .sort((a, b) => new Date(a.travelDate) - new Date(b.travelDate))
    .slice(0, 10);

  const methodSplit = {};
  allPayments.forEach((p) => {
    methodSplit[p.mode] = (methodSplit[p.mode] || 0) + (p.amount || 0);
  });

  const last30Days = [];
  for (let i = 29; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayStart = startOfDay(d);
    const dayEnd = endOfDay(d);
    const dayTotal = allPayments
      .filter((p) => {
        const pd = new Date(p.paymentDate || p.createdAt);
        return pd >= dayStart && pd <= dayEnd;
      })
      .reduce((s, p) => s + (p.amount || 0), 0);
    last30Days.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      amount: dayTotal,
    });
  }

  const recentTransactions = await BookingPayment.find(base)
    .sort({ createdAt: -1 })
    .limit(15)
    .populate('booking', 'bookingNumber destination')
    .lean();

  return {
    kpis: {
      todayCollection,
      monthCollection,
      pendingAmount: outstanding,
      outstanding,
      upcomingDueCount: upcomingDue.length,
      fullyPaidBookings: fullyPaid,
      pendingCount: pendingBookings.length,
      totalTransactions: allPayments.length,
    },
    collectionTrend: last30Days,
    methodSplit: Object.entries(methodSplit).map(([name, value]) => ({ name, value })),
    pendingVsPaid: [
      { name: 'Paid', value: bookings.filter((b) => b.paymentStatus === 'paid').length },
      { name: 'Partial', value: bookings.filter((b) => b.paymentStatus === 'partial').length },
      { name: 'Pending', value: bookings.filter((b) => b.paymentStatus === 'pending').length },
      { name: 'Overdue', value: bookings.filter((b) => b.paymentStatus === 'overdue').length },
    ],
    recentTransactions,
    upcomingDue,
  };
}

module.exports = {
  convertLeadWithAdvancePayment,
  recordBookingPayment,
  syncBookingPaymentTotals,
  listBookingPayments,
  getPaymentTimeline,
  resendReceipt,
  getReceiptPdfBuffer,
  buildPaymentDashboardStats,
  computePaymentStatus,
  computeProgress,
  logPaymentEvent,
};
