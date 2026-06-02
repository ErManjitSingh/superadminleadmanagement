const asyncHandler = require('../utils/asyncHandler');
const { buildReportsAnalytics } = require('../services/dashboardService');

const getAnalytics = asyncHandler(async (req, res) => {
  const analytics = await buildReportsAnalytics({ branchId: req.branchId });
  res.json(analytics);
});

module.exports = { getAnalytics };
