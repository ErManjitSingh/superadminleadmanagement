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
} = require('../services/bookingPaymentService');
const { pickQuotationForLead } = require('../services/leadConversionService');

const getConvertPreview = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id).lean();
  if (!lead) throw new ApiError(404, 'Lead not found');

  const quotation = await pickQuotationForLead(lead._id);
  const snap = quotation?.packageSnapshot || {};
  const totalAmount = quotation?.pricing?.total || quotation?.costing?.grandTotal || lead.budget || 0;

  res.json({
    customerName: lead.name,
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

  const lead = await Lead.findById(req.params.id);
  if (!lead) throw new ApiError(404, 'Lead not found');

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
  const booking = await Booking.findById(req.params.bookingId);
  if (!booking) throw new ApiError(404, 'Booking not found');

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
  const booking = await Booking.findById(req.params.bookingId);
  if (!booking) throw new ApiError(404, 'Booking not found');

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
  const payment = await BookingPayment.findById(req.params.paymentId).lean();
  if (!payment) throw new ApiError(404, 'Payment not found');
  if (payment.booking?.toString() !== req.params.bookingId) {
    throw new ApiError(404, 'Payment not found for this booking');
  }

  const buffer = getReceiptPdfBuffer(payment);
  if (!buffer) throw new ApiError(404, 'Receipt PDF not found');

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${payment.receiptFileName || 'receipt.pdf'}"`);
  res.send(buffer);
});

const resendPaymentReceipt = asyncHandler(async (req, res) => {
  const payment = await BookingPayment.findById(req.params.paymentId).lean();
  if (!payment) throw new ApiError(404, 'Payment not found');
  if (payment.booking?.toString() !== req.params.bookingId) {
    throw new ApiError(404, 'Payment not found for this booking');
  }

  const { channel = 'both' } = req.body || {};
  const results = await resendReceipt(payment._id, req.user, { channel });
  res.json({ success: true, results });
});

const markBookingFullyPaid = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId);
  if (!booking) throw new ApiError(404, 'Booking not found');

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

const acknowledgeNewBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findByIdAndUpdate(
    req.params.bookingId,
    { isNewBooking: false },
    { new: true }
  );
  if (!booking) throw new ApiError(404, 'Booking not found');
  res.json(booking);
});

const getLeadBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ lead: req.params.id })
    .select(
      '_id bookingNumber customerName destination travelDate returnDate status paymentStatus totalAmount advanceReceived totalPaid remainingBalance pendingAmount paymentProgress createdAt'
    )
    .lean();
  res.json({ booking: booking || null });
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
  acknowledgeNewBooking,
  getLeadBooking,
  sendPaymentReminderHandler,
};
