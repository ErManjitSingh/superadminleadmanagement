const fs = require('fs');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const cacheService = require('../services/cacheService');
const {
  generateVoucherForAssignment,
  regenerateVoucher,
  sendVoucherEmail,
  sendVoucherWhatsApp,
  getBookingExecution,
  getVoucherAnalytics,
  listVouchersFiltered,
  generateAllVouchersForBooking,
  getVoucherPdfBuffer,
} = require('../services/operationsVoucherExecutionService');

const getExecutionAnalytics = asyncHandler(async (req, res) => {
  const analytics = await getVoucherAnalytics();
  res.json(analytics);
});

const getBookingExecutionHub = asyncHandler(async (req, res) => {
  const data = await getBookingExecution(req.params.id);
  if (!data) throw new ApiError(404, 'Booking not found');
  res.json(data);
});

const generateBookingVoucher = asyncHandler(async (req, res) => {
  const { type = 'hotel', assignmentIndex = 0 } = req.body;
  const voucher = await generateVoucherForAssignment(req.params.id, {
    type,
    assignmentIndex: Number(assignmentIndex),
    actor: req.user,
  });
  await cacheService.invalidate('ops:');
  res.status(201).json(voucher);
});

const generateAllBookingVouchers = asyncHandler(async (req, res) => {
  const vouchers = await generateAllVouchersForBooking(req.params.id, req.user);
  await cacheService.invalidate('ops:');
  res.status(201).json(vouchers);
});

const generateTravelKit = asyncHandler(async (req, res) => {
  const voucher = await generateVoucherForAssignment(req.params.id, {
    type: 'travel_kit',
    assignmentIndex: 0,
    actor: req.user,
  });
  await cacheService.invalidate('ops:');
  res.status(201).json(voucher);
});

const getVoucher = asyncHandler(async (req, res) => {
  const { voucher } = await getVoucherPdfBuffer(req.params.id);
  if (!voucher) throw new ApiError(404, 'Voucher not found');
  res.json(voucher);
});

const downloadVoucherPdf = asyncHandler(async (req, res) => {
  const { voucher, buffer } = await getVoucherPdfBuffer(req.params.id);
  if (!buffer) throw new ApiError(404, 'PDF not found');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${voucher.fileName || 'voucher.pdf'}"`);
  res.send(buffer);
});

const regenerateVoucherHandler = asyncHandler(async (req, res) => {
  const voucher = await regenerateVoucher(req.params.id, req.user);
  await cacheService.invalidate('ops:');
  res.json(voucher);
});

const sendVoucherEmailHandler = asyncHandler(async (req, res) => {
  const result = await sendVoucherEmail(req.params.id, req.user, { to: req.body.to });
  await cacheService.invalidate('ops:');
  res.json(result);
});

const sendVoucherWhatsAppHandler = asyncHandler(async (req, res) => {
  const result = await sendVoucherWhatsApp(req.params.id, req.user, { phone: req.body.phone });
  await cacheService.invalidate('ops:');
  res.json(result);
});

const listVouchersEnhanced = asyncHandler(async (req, res) => {
  const vouchers = await listVouchersFiltered(req.query);
  res.json(vouchers);
});

module.exports = {
  getExecutionAnalytics,
  getBookingExecutionHub,
  generateBookingVoucher,
  generateAllBookingVouchers,
  generateTravelKit,
  getVoucher,
  downloadVoucherPdf,
  regenerateVoucherHandler,
  sendVoucherEmailHandler,
  sendVoucherWhatsAppHandler,
  listVouchersEnhanced,
};
