const ApiError = require('../utils/apiError');

function validatePaginationQuery(req, _res, next) {
  const { page, limit } = req.query;

  if (page !== undefined && (!Number.isFinite(Number(page)) || Number(page) < 1)) {
    throw new ApiError(400, 'page must be a positive integer');
  }

  if (limit !== undefined && (!Number.isFinite(Number(limit)) || Number(limit) < 1)) {
    throw new ApiError(400, 'limit must be a positive integer');
  }

  next();
}

module.exports = { validatePaginationQuery };
