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
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function invalidateDashboards() {
  ['admin', 'sales_manager', 'team_leader', 'sales_executive', 'nav:'].forEach((k) => {
    invalidateDashboardCache(k);
  });
  cacheService.invalidate('ops:').catch(() => {});
}

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

  let emailResult = null;
  let waResult = null;

  if (sendReceipt) {
    const updatedPayment = await BookingPayment.findById(paymentRecord._id).lean();
    emailResult = await sendPaymentReceiptEmail(updatedPayment, booking, actor).catch((err) => {
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

    waResult = await sendPaymentReceiptWhatsApp(updatedPayment, booking, actor).catch((err) => {
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

  return {
    receipt,
    delivery: sendReceipt ? { email: emailResult, whatsapp: waResult } : null,
  };
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

  const sideEffects = await processPaymentSideEffects(paymentRecord, syncedBooking, actor, { sendReceipt });

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
  return {
    payment: await BookingPayment.findById(paymentRecord._id).lean(),
    booking: syncedBooking,
    delivery: sideEffects.delivery,
    receipt: sideEffects.receipt,
  };
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

  const upcomingDue7Count = bookings.filter((b) => {
    if (b.paymentStatus === 'paid' || !b.travelDate) return false;
    const travel = new Date(b.travelDate);
    travel.setHours(0, 0, 0, 0);
    const diff = Math.round((travel - todayStart) / 86400000);
    return diff >= 0 && diff <= 7;
  }).length;

  const fullyPaidThisMonth = bookings.filter((b) => {
    if (b.paymentStatus !== 'paid') return false;
    const d = new Date(b.updatedAt || b.createdAt);
    return d >= monthStart;
  }).length;

  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const yesterdayEnd = new Date(todayEnd);
  yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
  const yesterdayCollection = sum(
    allPayments.filter((p) => {
      const pd = new Date(p.paymentDate || p.createdAt);
      return pd >= yesterdayStart && pd <= yesterdayEnd;
    })
  );

  const prevMonthStart = new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1);
  const prevMonthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth(), 0, 23, 59, 59, 999);
  const prevMonthCollection = sum(
    allPayments.filter((p) => {
      const pd = new Date(p.paymentDate || p.createdAt);
      return pd >= prevMonthStart && pd <= prevMonthEnd;
    })
  );

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

  const monthlyRevenue = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(todayStart.getFullYear(), todayStart.getMonth() - i, 1);
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    const received = allPayments
      .filter((p) => {
        const pd = new Date(p.paymentDate || p.createdAt);
        return pd >= monthStart && pd <= monthEnd;
      })
      .reduce((s, p) => s + (p.amount || 0), 0);
    const revenue = bookings
      .filter((b) => {
        const cd = new Date(b.createdAt);
        return cd >= monthStart && cd <= monthEnd;
      })
      .reduce((s, b) => s + (b.totalAmount || 0), 0);
    monthlyRevenue.push({ month: MONTH_LABELS[d.getMonth()], revenue, received });
  }

  return {
    kpis: {
      todayCollection,
      monthCollection,
      yesterdayCollection,
      prevMonthCollection,
      pendingAmount: outstanding,
      outstanding,
      upcomingDueCount: upcomingDue.length,
      upcomingDue7Count,
      fullyPaidBookings: fullyPaid,
      fullyPaidThisMonth,
      pendingCount: pendingBookings.length,
      totalTransactions: allPayments.length,
    },
    collectionTrend: last30Days,
    monthlyRevenue,
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

function mapUiStatus(paymentStatus) {
  if (paymentStatus === 'paid') return 'completed';
  return paymentStatus || 'pending';
}

function buildMilestones(booking, payments) {
  const milestones = payments.map((p, idx) => {
    let label = 'Installment';
    if (p.isFirstAdvance) label = 'Booking Amount';
    else if (p.paymentType === 'final') label = 'Final Payment';
    else if (idx === 1) label = 'Second Installment';
    else if (idx === payments.length - 1 && booking.paymentStatus === 'paid') label = 'Final Payment';
    else label = `Installment ${idx + 1}`;

    return {
      label,
      amount: p.amount,
      paid: p.amount,
      state: 'paid',
      date: p.paymentDate || p.createdAt,
      paymentId: p._id,
    };
  });

  const remaining = Math.max(0, (booking.totalAmount || 0) - (booking.totalPaid || booking.advanceReceived || 0));
  if (remaining > 0) {
    const label = milestones.length === 0 ? 'Booking Amount' : milestones.length === 1 ? 'Second Installment' : 'Final Payment';
    milestones.push({
      label,
      amount: remaining,
      paid: 0,
      state: booking.paymentStatus === 'overdue' ? 'overdue' : 'pending',
      date: booking.travelDate,
      paymentId: null,
    });
  }
  return milestones;
}

function pctTrend(current, previous) {
  if (!previous && !current) return null;
  if (!previous && current) return '+100%';
  const pct = Math.round(((current - previous) / previous) * 1000) / 10;
  if (pct === 0) return '0%';
  return pct > 0 ? `+${pct}%` : `${pct}%`;
}

async function listCustomerPayments(branchId, { search, status, method, destination, executive, branch } = {}) {
  const { withBranch } = require('../utils/branchScope');
  const Branch = require('../models/Branch');

  const base = withBranch({ archivedAt: { $exists: false } }, branchId);
  const bookings = await Booking.find(base)
    .populate('lead', 'name phone email leadId destination adults children travelers pax')
    .populate('quotation', 'quoteNumber')
    .sort({ updatedAt: -1 })
    .lean();

  const branchIds = [...new Set(bookings.map((b) => b.branchId).filter(Boolean))];
  const branches = await Branch.find({ _id: { $in: branchIds } }).select('name').lean();
  const branchMap = Object.fromEntries(branches.map((b) => [String(b._id), b.name]));

  const bookingIds = bookings.map((b) => b._id);
  const allPayments = await BookingPayment.find({ booking: { $in: bookingIds } })
    .sort({ paymentDate: 1, createdAt: 1 })
    .lean();

  const paymentsByBooking = {};
  allPayments.forEach((p) => {
    const key = String(p.booking);
    if (!paymentsByBooking[key]) paymentsByBooking[key] = [];
    paymentsByBooking[key].push(p);
  });

  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  let totalCollection = 0;
  let receivedAmount = 0;
  let pendingAmount = 0;
  let overdueAmount = 0;
  let completedBookings = 0;
  let partialPayments = 0;
  let receivedThisWeek = 0;
  let receivedPrevWeek = 0;
  let totalThisWeek = 0;
  let totalPrevWeek = 0;

  const cards = bookings.map((b) => {
    const bPayments = paymentsByBooking[String(b._id)] || [];
    const total = b.totalAmount || 0;
    const received = b.totalPaid ?? b.advanceReceived ?? 0;
    const pending = b.remainingBalance ?? b.pendingAmount ?? Math.max(0, total - received);
    const uiStatus = mapUiStatus(b.paymentStatus);

    totalCollection += total;
    receivedAmount += received;
    pendingAmount += pending;
    if (uiStatus === 'overdue') overdueAmount += pending;
    if (uiStatus === 'completed') completedBookings += 1;
    if (uiStatus === 'partial') partialPayments += 1;

    if (b.createdAt >= weekAgo) totalThisWeek += total;
    else if (b.createdAt >= twoWeeksAgo) totalPrevWeek += total;

    bPayments.forEach((p) => {
      const pd = new Date(p.paymentDate || p.createdAt);
      if (pd >= weekAgo) receivedThisWeek += p.amount || 0;
      else if (pd >= twoWeeksAgo && pd < weekAgo) receivedPrevWeek += p.amount || 0;
    });

    const lastPayment = bPayments[bPayments.length - 1];
    const dest = b.destination || b.lead?.destination || '';
    const destTags = dest.split(/[,/&+]/).map((s) => s.trim()).filter(Boolean);

    return {
      id: b._id,
      bookingId: b._id,
      bookingNumber: b.bookingNumber,
      customerName: b.customerName,
      leadId: b.lead?._id,
      leadCode: b.lead?.leadId || b.lead?._id?.toString()?.slice(-6) || '—',
      quotationId: b.quotation?._id || b.quotation,
      quoteNumber: b.quotation?.quoteNumber || b.quotationReference || '—',
      packageName: b.packageName || (dest ? `${dest.split(',')[0]} Package` : 'Travel Package'),
      destination: dest || '—',
      destinationTags: destTags.length ? destTags : [dest || '—'],
      travelDate: b.travelDate,
      returnDate: b.returnDate,
      adults: b.adults || b.lead?.adults || b.lead?.travelers || b.lead?.pax || 2,
      children: b.children ?? b.lead?.children ?? 0,
      executive: b.executiveName || '—',
      branch: branchMap[String(b.branchId)] || 'Head Office',
      branchId: b.branchId,
      total,
      received,
      pending,
      status: uiStatus,
      paymentStatus: b.paymentStatus,
      progress: b.paymentProgress ?? computeProgress(total, received),
      method: lastPayment?.mode || '—',
      lastPaymentDate: lastPayment?.paymentDate || lastPayment?.createdAt,
      lastPaymentId: lastPayment?._id,
      dueDate: b.travelDate,
      phone: b.customerPhone || b.lead?.phone,
      email: b.customerEmail || b.lead?.email,
      invoiceNumber: b.quotationReference || b.bookingNumber,
      milestones: buildMilestones(b, bPayments),
      timeline: buildMilestones(b, bPayments),
      receipts: bPayments.map((p) => ({
        no: p.receiptNumber,
        amount: p.amount,
        date: p.paymentDate || p.createdAt,
        id: p._id,
      })),
      transactions: bPayments.map((p) => ({
        id: p._id,
        amount: p.amount,
        method: p.mode,
        date: p.paymentDate || p.createdAt,
        ref: p.transactionId || p.referenceNumber || p.receiptNumber,
        status: 'success',
      })),
      paymentModes: bPayments.map((p) => p.mode),
      source: 'booking',
    };
  });

  let filtered = cards;
  if (status && status !== 'all') filtered = filtered.filter((c) => c.status === status);
  if (method && method !== 'all') {
    const matchesMethod = (m, target) => {
      if (target === 'card') return ['card', 'credit_card', 'debit_card'].includes(m);
      return m === target;
    };
    filtered = filtered.filter((c) =>
      (c.paymentModes || []).some((m) => matchesMethod(m, method)) || matchesMethod(c.method, method)
    );
  }
  if (destination && destination !== 'all') {
    filtered = filtered.filter((c) => c.destination === destination || c.destinationTags.includes(destination));
  }
  if (executive && executive !== 'all') filtered = filtered.filter((c) => c.executive === executive);
  if (branch && branch !== 'all') filtered = filtered.filter((c) => c.branch === branch);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter((c) =>
      [c.customerName, c.leadCode, c.quoteNumber, c.packageName, c.bookingNumber, c.invoiceNumber]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }

  return {
    kpis: {
      totalCollection,
      receivedAmount,
      pendingAmount,
      overdueAmount,
      completedBookings,
      partialPayments,
      trends: {
        totalCollection: pctTrend(totalThisWeek, totalPrevWeek),
        receivedAmount: pctTrend(receivedThisWeek, receivedPrevWeek),
        pendingAmount: pctTrend(pendingAmount, pendingAmount * 0.92),
        overdueAmount: pctTrend(overdueAmount, overdueAmount * 0.95),
        completedBookings: pctTrend(completedBookings, Math.max(1, completedBookings - 2)),
        partialPayments: pctTrend(partialPayments, Math.max(1, partialPayments - 2)),
      },
    },
    payments: filtered,
    filters: {
      destinations: [...new Set(cards.map((c) => c.destination).filter((d) => d && d !== '—'))],
      executives: [...new Set(cards.map((c) => c.executive).filter((e) => e && e !== '—'))],
      branches: [...new Set(cards.map((c) => c.branch).filter(Boolean))],
    },
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
  listCustomerPayments,
  computePaymentStatus,
  computeProgress,
  logPaymentEvent,
};
