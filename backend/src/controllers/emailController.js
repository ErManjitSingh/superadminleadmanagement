const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const { queueLeadEmail, getLeadEmailHistory } = require('../services/emailSendService');
const { getEmailDashboardStats } = require('../services/emailStatsService');
const { isEmailConfigured } = require('../services/emailService');

const sendLeadEmail = asyncHandler(async (req, res) => {
  if (!req.permissions?.email?.send) {
    throw new ApiError(403, 'You do not have permission to send emails');
  }

  const result = await queueLeadEmail({
    req,
    leadId: req.params.id,
    payload: req.body,
  });

  res.status(202).json(result);
});

const listLeadEmailHistory = asyncHandler(async (req, res) => {
  if (!req.permissions?.email?.send) {
    throw new ApiError(403, 'You do not have permission to view email history');
  }

  const history = await getLeadEmailHistory(req.params.id, {
    branchId: req.branchId,
    limit: Number(req.query.limit) || 30,
  });

  res.json(history);
});

const getEmailStats = asyncHandler(async (req, res) => {
  if (!req.permissions?.email?.send) {
    throw new ApiError(403, 'You do not have permission to view email stats');
  }

  const userId = req.user.role === 'sales_executive' ? req.user._id : null;
  const stats = await getEmailDashboardStats({ branchId: req.branchId, userId });
  res.json({ ...stats, configured: isEmailConfigured() });
});

module.exports = { sendLeadEmail, listLeadEmailHistory, getEmailStats };
