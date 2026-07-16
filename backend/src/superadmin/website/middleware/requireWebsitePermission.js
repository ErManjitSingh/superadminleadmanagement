const ApiError = require('../../../utils/apiError');
const { hasWebsitePermission } = require('../utils/permissions');

function requireWebsitePermission(module, action) {
  return (req, res, next) => {
    if (!req.superAdmin) {
      return next(new ApiError(401, 'Not authorized'));
    }
    if (!hasWebsitePermission(req.superAdmin, module, action)) {
      return next(new ApiError(403, `Missing permission: ${module}.${action}`));
    }
    return next();
  };
}

module.exports = { requireWebsitePermission };
