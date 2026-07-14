const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const BookingPayment = require('../models/BookingPayment');
const Booking = require('../models/Booking');
const Lead = require('../models/Lead');
const Quotation = require('../models/Quotation');
const {
  convertLeadWithAdvancePayment,
  recordBookingPayment,
  listBookingPayments,
  getPaymentTimeline,
  resendReceipt,
  getReceiptPdfBuffer,
  buildPaymentDashboardStats,
  listCustomerPayments,
} = require('../services/bookingPaymentService');
const { pickQuotationForLead } = require('../services/leadConversionService');
const { tenantFilter, companyScopedIdFilter, assertTenantDocument } = require('../utils/tenantDocument');

const getConvertPreview = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne(tenantFilter({ _id: req.params.id }, req)).lean();
  assertTenantDocument(lead, req, 'Lead');

  const quotation = await pickQuotationForLead(lead._id);
  const snap = quotation?.packageSnapshot || {};
  const totalAmount = quotation?.pricing?.total || quotation?.costing?.grandTotal || lead.budget || 0;

  res.json({
    customerName: lead.name,
    customerPhone: lead.whatsapp || lead.phone || '',
    phone: lead.phone || '',
    whatsapp: lead.whatsapp || lead.phone || '',
    leadId: lead._id,
    leadNumber: lead.leadId || lead._id,
    packageName: snap.name || snap.title || lead.packageName || '',
    destination: lead.destination || snap.destination || '',
    travelDate: lead.travelDate,
    returnDate: lead.returnDate,
    travellers: (lead.adults || lead.travelers || lead.pax || 1) + (lead.children || 0),
    adults: lead.adults || lead.travelers || lead.pax || 2,
    children: lead.children || 0,
    totalPackageCost: totalAmount,
    quotationId: quotation?._id,
    quotationNumber: quotation?.quoteNumber,
    status: lead.status,
    hasBooking: !!(await Booking.exists({ lead: lead._id })),
  });
});

const convertLeadWithPayment = asyncHandler(async (req, res) => {
  const { amount, paymentDate, mode, paymentMode, transactionId, referenceNumber, bankName, remarks, screenshotBase64, sendReceipt } = req.body;

  if (!amount || Number(amount) <= 0) {
    throw new ApiError(400, 'Advance amount is required');
  }

  const lead = await Lead.findOne(tenantFilter({ _id: req.params.id }, req));
  assertTenantDocument(lead, req, 'Lead');

  if (req.user.role === 'sales_executive' && lead.assignedTo?.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You can only convert leads assigned to you');
  }

  const result = await convertLeadWithAdvancePayment(
    req.params.id,
    {
      amount: Number(amount),
      paymentDate,
      mode: mode || paymentMode || 'upi',
      transactionId,
      referenceNumber,
      bankName,
      remarks,
      screenshotBase64,
      sendReceipt,
    },
    req.user
  );

  res.status(201).json(result);
});

const listPaymentsForBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne(companyScopedIdFilter(req.params.bookingId, req));
  assertTenantDocument(booking, req, 'Booking');

  const payments = await listBookingPayments(req.params.bookingId);
  const timeline = await getPaymentTimeline(req.params.bookingId);

  res.json({
    payments,
    timeline,
    summary: {
      packageCost: booking.totalAmount || 0,
      advanceReceived: booking.advanceReceived || 0,
      totalPaid: booking.totalPaid || booking.advanceReceived || 0,
      remainingBalance: booking.remainingBalance ?? booking.pendingAmount ?? 0,
      paymentProgress: booking.paymentProgress || 0,
      paymentStatus: booking.paymentStatus || 'pending',
    },
  });
});

const addBookingPayment = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne(companyScopedIdFilter(req.params.bookingId, req));
  assertTenantDocument(booking, req, 'Booking');

  if (req.user.role === 'sales_executive') {
    throw new ApiError(403, 'Sales executives can only collect the first advance payment during lead conversion');
  }

  const { amount, paymentDate, mode, paymentMode, transactionId, referenceNumber, bankName, remarks, screenshotBase64, sendReceipt } = req.body;
  if (!amount || Number(amount) <= 0) throw new ApiError(400, 'Valid payment amount is required');

  const result = await recordBookingPayment(
    req.params.bookingId,
    {
      amount: Number(amount),
      paymentDate,
      mode: mode || paymentMode || 'upi',
      transactionId,
      referenceNumber,
      bankName,
      remarks,
      screenshotBase64,
    },
    req.user,
    { isFirstAdvance: false, sendReceipt: sendReceipt !== false }
  );

  res.status(201).json(result);
});

const getPaymentReceipt = asyncHandler(async (req, res) => {
  const payment = await BookingPayment.findOne(companyScopedIdFilter(req.params.paymentId, req)).lean();
  assertTenantDocument(payment, req, 'Payment');
  if (payment.booking?.toString() !== req.params.bookingId) {
    throw new ApiError(404, 'Payment not found for this booking');
  }

  const forceRegenerate = ['1', 'true', 'yes'].includes(String(req.query.fresh || '').toLowerCase());
  const buffer = await getReceiptPdfBuffer(payment, { forceRegenerate });
  if (!buffer) throw new ApiError(404, 'Receipt PDF not found');

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${payment.receiptFileName || 'receipt.pdf'}"`);
  res.send(buffer);
});

const resendPaymentReceipt = asyncHandler(async (req, res) => {
  const payment = await BookingPayment.findOne(companyScopedIdFilter(req.params.paymentId, req)).lean();
  assertTenantDocument(payment, req, 'Payment');
  if (payment.booking?.toString() !== req.params.bookingId) {
    throw new ApiError(404, 'Payment not found for this booking');
  }

  const { channel = 'both' } = req.body || {};
  const results = await resendReceipt(payment._id, req.user, { channel });
  res.json({ success: true, results });
});

const markBookingFullyPaid = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne(companyScopedIdFilter(req.params.bookingId, req));
  assertTenantDocument(booking, req, 'Booking');

  if (!['operations_manager', 'admin'].includes(req.user.role)) {
    throw new ApiError(403, 'Only operations managers can mark bookings as fully paid');
  }

  const remaining = Math.max(0, (booking.totalAmount || 0) - (booking.totalPaid || booking.advanceReceived || 0));
  if (remaining > 0) {
    throw new ApiError(400, `Outstanding balance of ₹${remaining} remains`);
  }

  booking.paymentStatus = 'paid';
  booking.paymentProgress = 100;
  booking.remainingBalance = 0;
  booking.pendingAmount = 0;
  if (!['confirmed', 'in_progress', 'completed'].includes(booking.status)) {
    booking.status = 'confirmed';
  }
  await booking.save();

  res.json(booking.toObject());
});

const getPaymentsDashboard = asyncHandler(async (req, res) => {
  const stats = await buildPaymentDashboardStats(req.branchId);
  res.json(stats);
});

const getCustomerPayments = asyncHandler(async (req, res) => {
  const { search, status, method, destination, executive, branch } = req.query;
  const data = await listCustomerPayments(req.branchId, {
    search,
    status,
    method,
    destination,
    executive,
    branch,
  });
  res.json(data);
});

const acknowledgeNewBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findOneAndUpdate(
    companyScopedIdFilter(req.params.bookingId, req),
    { isNewBooking: false },
    { new: true }
  );
  assertTenantDocument(booking, req, 'Booking');
  res.json(booking);
});

const getLeadBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne(tenantFilter({ lead: req.params.id }, req))
    .select(
      '_id bookingNumber customerName customerPhone customerEmail destination travelDate returnDate status paymentStatus totalAmount advanceReceived totalPaid remainingBalance pendingAmount paymentProgress firstAdvancePaymentId createdAt'
    )
    .lean();

  if (!booking) {
    return res.json({ booking: null, advancePayment: null });
  }

  const advanceFilter = booking.firstAdvancePaymentId
    ? { _id: booking.firstAdvancePaymentId }
    : { booking: booking._id, isFirstAdvance: true };

  const advancePayment = await BookingPayment.findOne(advanceFilter)
    .select(
      '_id receiptNumber amount mode paymentDate isFirstAdvance receiptFileName whatsappSentAt emailSentAt createdByName createdAt'
    )
    .lean();

  res.json({ booking, advancePayment: advancePayment || null });
});

const sendPaymentReminderHandler = asyncHandler(async (req, res) => {
  if (!['operations_manager', 'admin'].includes(req.user.role)) {
    throw new ApiError(403, 'Only operations managers can send payment reminders');
  }

  const { channels = ['email', 'whatsapp', 'notification'] } = req.body || {};
  const { sendManualPaymentReminder } = require('../services/paymentReminderService');

  try {
    const result = await sendManualPaymentReminder(req.params.bookingId, req.user, { channels });
    res.json({ success: true, ...result });
  } catch (err) {
    throw new ApiError(400, err.message);
  }
});

module.exports = {
  getConvertPreview,
  convertLeadWithPayment,
  listPaymentsForBooking,
  addBookingPayment,
  getPaymentReceipt,
  resendPaymentReceipt,
  markBookingFullyPaid,
  getPaymentsDashboard,
  getCustomerPayments,
  acknowledgeNewBooking,
  getLeadBooking,
  sendPaymentReminderHandler,
};
