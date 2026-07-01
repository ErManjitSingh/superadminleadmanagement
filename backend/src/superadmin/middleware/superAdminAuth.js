const jwt = require('jsonwebtoken');
const SuperAdmin = require('../models/SuperAdmin');
const ApiError = require('../../utils/apiError');
const asyncHandler = require('../../utils/asyncHandler');
const { superAdminJwtSecret } = require('../../config/env');

const SUPER_ADMIN_AUDIENCE = 'superadmin';

const generateSuperAdminToken = (id) =>
  jwt.sign({ id, aud: SUPER_ADMIN_AUDIENCE }, superAdminJwtSecret, {
    expiresIn: process.env.SUPERADMIN_JWT_EXPIRES_IN || '8h',
  });

const superAdminProtect = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) throw new ApiError(401, 'Not authorized');

  let decoded;
  try {
    decoded = jwt.verify(token, superAdminJwtSecret);
  } catch {
    throw new ApiError(401, 'Invalid or expired token');
  }

  if (decoded.aud !== SUPER_ADMIN_AUDIENCE) {
    throw new ApiError(401, 'Invalid token audience');
  }

  const admin = await SuperAdmin.findById(decoded.id).notDeleted().select('-password');
  if (!admin || admin.status === 'disabled') {
    throw new ApiError(401, 'Super admin not found or disabled');
  }

  req.superAdmin = admin;
  next();
});

function formatSuperAdminResponse(admin) {
  return {
    id: admin._id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    status: admin.status,
    lastLogin: admin.lastLogin,
    avatar: admin.avatar,
  };
}

module.exports = {
  SUPER_ADMIN_AUDIENCE,
  generateSuperAdminToken,
  superAdminProtect,
  formatSuperAdminResponse,
};
