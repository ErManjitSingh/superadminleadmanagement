const FollowUp = require('../models/FollowUp');
const { FOLLOWUP_POPULATE, startOfDay, endOfDay } = require('../utils/queryHelpers');
const { parsePagination, paginatedResponse } = require('../utils/pagination');

function buildRoleFilter(user, branchId) {
  const filter = {};
  if (branchId) filter.branchId = branchId;
  if (user.role === 'sales_executive') {
    filter.assignedTo = user._id;
  }
  return filter;
}

function buildTabFilter(tab) {
  const todayStart = startOfDay();
  const todayEnd = endOfDay();
  const now = new Date();

  if (tab === 'today') {
    return { status: 'pending', scheduledAt: { $gte: todayStart, $lte: todayEnd } };
  }
  if (tab === 'upcoming') {
    return { status: 'pending', scheduledAt: { $gt: todayEnd } };
  }
  if (tab === 'missed') {
    return { status: 'missed' };
  }
  if (tab === 'overdue') {
    return { status: 'pending', scheduledAt: { $lt: now } };
  }
  return {};
}

async function getReminderCounts(user, branchId) {
  const base = buildRoleFilter(user, branchId);
  const todayStart = startOfDay();
  const todayEnd = endOfDay();
  const now = new Date();

  const [today, upcoming, missed, overdue] = await Promise.all([
    FollowUp.countDocuments({ ...base, status: 'pending', scheduledAt: { $gte: todayStart, $lte: todayEnd } }),
    FollowUp.countDocuments({ ...base, status: 'pending', scheduledAt: { $gt: todayEnd } }),
    FollowUp.countDocuments({ ...base, status: 'missed' }),
    FollowUp.countDocuments({ ...base, status: 'pending', scheduledAt: { $lt: now } }),
  ]);

  return { today, upcoming, missed, overdue, total: today + upcoming + missed + overdue };
}

async function listReminders(user, branchId, { tab = 'today', page = 1, limit = 25 } = {}) {
  const skip = (Math.max(1, page) - 1) * limit;
  const filter = { ...buildRoleFilter(user, branchId), ...buildTabFilter(tab) };

  const [rows, total] = await Promise.all([
    FollowUp.find(filter)
      .populate(FOLLOWUP_POPULATE)
      .sort({ scheduledAt: tab === 'upcoming' ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    FollowUp.countDocuments(filter),
  ]);

  return paginatedResponse(rows, { page, limit, total });
}

module.exports = { getReminderCounts, listReminders, buildTabFilter };
