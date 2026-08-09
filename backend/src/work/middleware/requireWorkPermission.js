const ApiError = require('../../utils/apiError');
const { resolveWorkAccess } = require('../config/access');

function attachWorkAccess(req, _res, next) {
  req.workAccess = resolveWorkAccess(req.user);
  if (!req.workAccess.enabled || !req.workAccess.permissions.access) {
    return next(new ApiError(403, 'WorkFlow Hub access is disabled for this account'));
  }
  next();
}

function requireWorkPermission(permission) {
  return (req, _res, next) => {
    const access = req.workAccess || resolveWorkAccess(req.user);
    if (!access.enabled || !access.permissions[permission]) {
      return next(new ApiError(403, `WorkFlow Hub permission required: ${permission}`));
    }
    next();
  };
}

module.exports = { attachWorkAccess, requireWorkPermission };
