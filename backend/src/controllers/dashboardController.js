const asyncHandler = require('../utils/asyncHandler');
const { buildAdminDashboard } = require('../services/dashboardService');
const { getOrSetFresh, cacheKey } = require('../services/dashboardCacheService');

const getStats = asyncHandler(async (req, res) => {
  const stats = await getOrSetFresh(
    req,
    cacheKey('admin', `dashboard:${req.branchId || 'all'}`),
    () => buildAdminDashboard({ branchId: req.branchId }),
    60 * 1000
  );
  res.json(stats);
});

module.exports = { getStats };
