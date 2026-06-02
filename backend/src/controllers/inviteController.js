const User = require('../models/User');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { ROLE_LABELS } = require('../config/roles');
const { logActivity, getClientIp } = require('../services/activityService');

const getInvite = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    inviteToken: req.params.token,
    status: 'invited',
  }).select('-password');

  if (!user) throw new ApiError(404, 'Invite not found or expired');
  if (user.inviteExpiresAt && user.inviteExpiresAt < new Date()) {
    throw new ApiError(410, 'Invite has expired');
  }

  res.json({
    email: user.email,
    name: user.name,
    roleName: user.roleName || ROLE_LABELS[user.role] || user.role,
    department: user.department,
  });
});

const acceptInvite = asyncHandler(async (req, res) => {
  const { token, password, name } = req.body;
  if (!token || !password) throw new ApiError(400, 'token and password are required');

  const user = await User.findOne({ inviteToken: token, status: 'invited' });
  if (!user) throw new ApiError(404, 'Invalid invite token');
  if (user.inviteExpiresAt && user.inviteExpiresAt < new Date()) {
    throw new ApiError(410, 'Invite has expired');
  }

  user.name = name || user.name;
  user.password = password;
  user.status = 'active';
  user.inviteToken = undefined;
  user.inviteExpiresAt = undefined;
  await user.save();

  await logActivity({
    type: 'user_action',
    user: user.name,
    userId: user._id,
    action: 'Accepted invite',
    target: user.email,
    ip: getClientIp(req),
    branchId: user.branchId || null,
  });

  res.json({ message: 'Account activated successfully', user: { _id: user._id, email: user.email, name: user.name } });
});

module.exports = { getInvite, acceptInvite };
