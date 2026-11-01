const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { getPermissionsForRole } = require('../config/permissions');
const { resolveUserPermissions } = require('../services/permissionsService');
const { ROLE_LABELS, ROLE_DASHBOARD_PATHS } = require('../config/roles');
const { attachTenantContext } = require('./tenantContext');

const protect = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) throw new ApiError(401, 'Not authorized, no token');

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id).select('-password');
  if (!user || user.status === 'disabled') throw new ApiError(401, 'User not found or disabled');
  if (decoded.cid && user.companyId && String(decoded.cid) !== String(user.companyId)) {
    throw new ApiError(401, 'Not authorized for this company');
  }

  req.user = user;
  req.permissions = await resolveUserPermissions(user);
  req.branchId = null;
  return attachTenantContext(req, res, next);
});

function formatUserResponse(user, permissions) {
  const obj = user.toObject ? user.toObject() : user;
  const perms = permissions || getPermissionsForRole(obj.role);
  return {
    _id: obj._id,
    id: obj._id,
    name: obj.name,
    email: obj.email,
    phone: obj.phone,
    role: obj.role,
    roleId: obj.roleId,
    roleName: ROLE_LABELS[obj.role] || obj.role,
    department: obj.department,
    status: obj.status,
    companyId: obj.companyId || null,
    teamId: obj.teamId,
    permissions: perms,
    dashboardPath: ROLE_DASHBOARD_PATHS[obj.role] || '/',
    executiveName: obj.role === 'sales_executive' ? obj.name : undefined,
    teamLeaderName: obj.role === 'team_leader' ? obj.name : undefined,
  };
}

const RESTRICTED_SESSION_ROLES = ['admin', 'sales_manager'];

/** Parse durations like 30m / 12h / 7d into milliseconds (for session meta). */
function durationToMs(value, fallbackMs) {
  const raw = String(value || '').trim();
  const m = raw.match(/^(\d+)\s*([smhd])$/i);
  if (!m) return fallbackMs;
  const n = Number(m[1]);
  const unit = m[2].toLowerCase();
  const mult = unit === 's' ? 1000 : unit === 'm' ? 60_000 : unit === 'h' ? 3_600_000 : 86_400_000;
  return n * mult;
}

const generateToken = (id, role, companyId) => {
  const restricted = RESTRICTED_SESSION_ROLES.includes(role);
  // Ops / SE mobile: long-lived (1y). Restricted web roles stay shorter.
  const expiresIn = restricted
    ? process.env.JWT_EXPIRES_IN_RESTRICTED || '7d'
    : process.env.JWT_EXPIRES_IN || '365d';
  const payload = { id };
  if (companyId) payload.cid = String(companyId);
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

function getRestrictedSessionMeta(role) {
  if (!RESTRICTED_SESSION_ROLES.includes(role)) return {};
  const expiresIn = process.env.JWT_EXPIRES_IN_RESTRICTED || '7d';
  const ms = durationToMs(expiresIn, 7 * 24 * 60 * 60 * 1000);
  return {
    sessionExpiresAt: new Date(Date.now() + ms).toISOString(),
    sessionTimeoutMinutes: Math.max(1, Math.round(ms / 60_000)),
  };
}

module.exports = {
  protect,
  formatUserResponse,
  generateToken,
  getRestrictedSessionMeta,
  RESTRICTED_SESSION_ROLES,
};
