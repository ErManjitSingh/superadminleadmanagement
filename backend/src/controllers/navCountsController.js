const asyncHandler = require('../utils/asyncHandler');
const { buildNavCounts } = require('../services/navCountsService');
const { getOrSet, navCountsKey, NAV_COUNTS_TTL_MS } = require('../services/dashboardCacheService');

const getNavCounts = asyncHandler(async (req, res) => {
  const role = req.user?.role || 'admin';
  const key = navCountsKey(role, String(req.user._id), req.branchId);

  const counts = await getOrSet(
    key,
    () => buildNavCounts(req.user, { branchId: req.branchId }),
    NAV_COUNTS_TTL_MS
  );

  res.json(counts);
});

module.exports = { getNavCounts };
