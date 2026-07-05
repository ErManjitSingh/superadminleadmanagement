const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const {
  getVendorConfirmationPage,
  respondVendorConfirmation,
} = require('../services/operationsVoucherExecutionService');

const getVendorConfirm = asyncHandler(async (req, res) => {
  const data = await getVendorConfirmationPage(req.params.token);
  if (!data) throw new ApiError(404, 'Confirmation link is invalid or expired');
  res.json(data);
});

const postVendorConfirm = asyncHandler(async (req, res) => {
  const action = req.body.action;
  if (!['accept', 'reject', 'changes'].includes(action)) {
    throw new ApiError(400, 'Invalid action. Use accept, reject, or changes.');
  }
  const voucher = await respondVendorConfirmation(req.params.token, {
    action,
    notes: req.body.notes,
  });
  res.json({ success: true, voucher });
});

module.exports = {
  getVendorConfirm,
  postVendorConfirm,
};
