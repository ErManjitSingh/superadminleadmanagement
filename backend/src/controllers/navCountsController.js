const asyncHandler = require('../utils/asyncHandler');
const { buildNavCounts } = require('../services/navCountsService');

const getNavCounts = asyncHandler(async (req, res) => {
  const counts = await buildNavCounts(req.user, { branchId: req.branchId });
  res.json(counts);
});

module.exports = { getNavCounts };
