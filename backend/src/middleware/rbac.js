const ApiError = require('../utils/apiError');

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return next(new ApiError(401, 'Not authorized'));
  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, `Role ${req.user.role} is not allowed`));
  }
  next();
};

module.exports = { authorize };
