const asyncHandler = require('../../utils/asyncHandler');
const { getDashboardMetrics } = require('../services/dashboardMetricsService');

const getDashboard = asyncHandler(async (req, res) => {
  const data = await getDashboardMetrics();
  res.json(data);
});

module.exports = { getDashboard };
