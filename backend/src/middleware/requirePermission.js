const ApiError = require('../utils/apiError');
const { getPermissionsForRole } = require('../config/permissions');

/** Require role permission on a module action (view, create, edit, delete). */
function requirePermission(module, action) {
  return (req, res, next) => {
    const perms = getPermissionsForRole(req.user?.role);
    if (!perms[module]?.[action]) {
      return next(new ApiError(403, `You do not have permission to ${action} ${module}`));
    }
    next();
  };
}

module.exports = { requirePermission };
