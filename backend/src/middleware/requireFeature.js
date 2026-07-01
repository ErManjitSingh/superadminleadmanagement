const ApiError = require('../utils/apiError');

function requireFeature(featureKey) {
  return (req, res, next) => {
    const features = req.tenantCompany?.features;
    if (!features) return next();
    if (features[featureKey] === false) {
      return next(new ApiError(403, `This module is not enabled on your plan (${featureKey})`));
    }
    return next();
  };
}

module.exports = { requireFeature };
