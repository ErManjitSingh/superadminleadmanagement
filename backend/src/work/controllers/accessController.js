const asyncHandler = require('../../utils/asyncHandler');
const { getClientIp } = require('../../services/activityService');
const {
  createWorkUser,
  getAccessConfiguration,
  listWorkUsers,
  resetWorkUserPassword,
  serializeUser,
  updateWorkAccess,
} = require('../services/accessService');

const getMyWorkAccess = asyncHandler(async (req, res) => {
  res.json({
    user: serializeUser(req.user.toObject ? req.user.toObject() : req.user),
    configuration: getAccessConfiguration(),
  });
});

const getWorkAccessConfiguration = asyncHandler(async (_req, res) => {
  res.json(getAccessConfiguration());
});

const listUsers = asyncHandler(async (req, res) => {
  const result = await listWorkUsers({
    companyId: req.companyId,
    query: req.query,
  });
  res.json(result);
});

const inviteWorkUser = asyncHandler(async (req, res) => {
  const result = await createWorkUser({
    companyId: req.companyId,
    actor: req.user,
    payload: req.body,
    ip: getClientIp(req),
  });
  res.status(201).json({
    ...result,
    message: 'WorkFlow Hub invitation created successfully',
  });
});

const updateUserAccess = asyncHandler(async (req, res) => {
  const user = await updateWorkAccess({
    companyId: req.companyId,
    targetUserId: req.params.userId,
    actor: req.user,
    payload: req.body,
    ip: getClientIp(req),
  });
  res.json({ user, message: 'WorkFlow Hub access updated successfully' });
});

const generateTemporaryPassword = asyncHandler(async (req, res) => {
  const credentials = await resetWorkUserPassword({
    companyId: req.companyId,
    targetUserId: req.params.userId,
    actor: req.user,
    ip: getClientIp(req),
  });
  res.json({
    ...credentials,
    message: 'Temporary login password generated. It will not be shown again.',
  });
});

module.exports = {
  inviteWorkUser,
  getMyWorkAccess,
  getWorkAccessConfiguration,
  generateTemporaryPassword,
  listUsers,
  updateUserAccess,
};
