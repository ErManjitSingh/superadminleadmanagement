const asyncHandler = require('../utils/asyncHandler');
const { getReminderCounts, listReminders } = require('../services/reminderService');

const getCounts = asyncHandler(async (req, res) => {
  const counts = await getReminderCounts(req.user, req.branchId);
  res.json(counts);
});

const list = asyncHandler(async (req, res) => {
  const tab = req.query.tab || 'today';
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 25;
  const result = await listReminders(req.user, req.branchId, { tab, page, limit });
  res.json(result);
});

module.exports = { getCounts, list };
