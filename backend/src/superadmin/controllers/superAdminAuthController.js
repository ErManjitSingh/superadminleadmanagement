const SuperAdmin = require('../models/SuperAdmin');
const ApiError = require('../../utils/apiError');
const asyncHandler = require('../../utils/asyncHandler');
const {
  generateSuperAdminToken,
  formatSuperAdminResponse,
} = require('../middleware/superAdminAuth');
const { logPlatformAudit } = require('../services/platformAuditService');

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password required');

  const admin = await SuperAdmin.findOne({ email: email.toLowerCase().trim() }).notDeleted().select('+password');
  if (!admin || admin.status === 'disabled') {
    throw new ApiError(401, 'Invalid credentials');
  }

  const valid = await admin.matchPassword(password);
  if (!valid) throw new ApiError(401, 'Invalid credentials');

  admin.lastLogin = new Date();
  await admin.save();

  const token = generateSuperAdminToken(admin._id);

  await logPlatformAudit({
    actor: admin,
    action: 'login',
    resourceType: 'super_admin',
    resourceId: admin._id,
    req,
  });

  res.json({
    token,
    user: formatSuperAdminResponse(admin),
  });
});

const getMe = asyncHandler(async (req, res) => {
  res.json({ user: formatSuperAdminResponse(req.superAdmin) });
});

const logout = asyncHandler(async (req, res) => {
  await logPlatformAudit({
    actor: req.superAdmin,
    action: 'logout',
    resourceType: 'super_admin',
    resourceId: req.superAdmin._id,
    req,
  });
  res.json({ message: 'Logged out' });
});

module.exports = { login, getMe, logout };
