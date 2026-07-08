const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const {
  getEmailIntegrationSettings,
  testSmtpConnection,
  saveEmailIntegrationSettings,
  disconnectEmailIntegration,
  listEmailIntegrationLogs,
} = require('../services/emailIntegrationService');

const getSettings = asyncHandler(async (req, res) => {
  const data = await getEmailIntegrationSettings(req.companyId);
  res.json(data);
});

const testSmtp = asyncHandler(async (req, res) => {
  try {
    const result = await testSmtpConnection(req.companyId, req.body, req.user);
    res.json(result);
  } catch (err) {
    throw new ApiError(400, err.message || 'SMTP test failed');
  }
});

const saveSettings = asyncHandler(async (req, res) => {
  try {
    const data = await saveEmailIntegrationSettings(req.companyId, req.body);
    res.json({ success: true, message: 'Email configuration saved and verified', ...data });
  } catch (err) {
    throw new ApiError(400, err.message || 'Could not save email configuration');
  }
});

const updateSettings = asyncHandler(async (req, res) => {
  try {
    const data = await saveEmailIntegrationSettings(req.companyId, req.body);
    res.json({ success: true, message: 'Email settings updated', ...data });
  } catch (err) {
    throw new ApiError(400, err.message || 'Could not update email settings');
  }
});

const disconnect = asyncHandler(async (req, res) => {
  const result = await disconnectEmailIntegration(req.companyId);
  res.json(result);
});

const getLogs = asyncHandler(async (req, res) => {
  const data = await listEmailIntegrationLogs(req.companyId, {
    page: Number(req.query.page) || 1,
    limit: Math.min(100, Number(req.query.limit) || 20),
  });
  res.json(data);
});

module.exports = {
  getSettings,
  testSmtp,
  saveSettings,
  updateSettings,
  disconnect,
  getLogs,
};
