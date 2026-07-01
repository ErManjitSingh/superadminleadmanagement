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

const generateToken = (id, role) => {
  const restricted = RESTRICTED_SESSION_ROLES.includes(role);
  const expiresIn = restricted
    ? process.env.JWT_EXPIRES_IN_RESTRICTED || '30m'
    : process.env.JWT_EXPIRES_IN || '30d';
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn });
};

const RESTRICTED_SESSION_MS = 30 * 60 * 1000;

function getRestrictedSessionMeta(role) {
  if (!RESTRICTED_SESSION_ROLES.includes(role)) return {};
  return {
    sessionExpiresAt: new Date(Date.now() + RESTRICTED_SESSION_MS).toISOString(),
    sessionTimeoutMinutes: 30,
  };
}

module.exports = {
  protect,
  formatUserResponse,
  generateToken,
  getRestrictedSessionMeta,
  RESTRICTED_SESSION_ROLES,
};
