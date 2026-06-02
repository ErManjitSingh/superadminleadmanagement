const FollowUp = require('../models/FollowUp');
const { getFollowUpSummary } = require('../repositories/roleScopedRepository');
const { buildFollowUpTabFilter } = require('../utils/queryHelpers');

async function getAdminFollowUpSummary() {
  return getFollowUpSummary({});
}

async function getExecutiveFollowUpSummary(userId, leadIds) {
  return getFollowUpSummary({
    $or: [{ assignedTo: userId }, { lead: { $in: leadIds } }],
  });
}

async function getMissedFollowUpsPreview(baseFilter, limit = 8) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  return FollowUp.find({
    ...baseFilter,
    ...buildFollowUpTabFilter('missed'),
  })
    .populate('lead', 'name phone destination')
    .populate('assignedTo', 'name')
    .sort({ scheduledAt: 1 })
    .limit(limit)
    .lean();
}

module.exports = {
  getAdminFollowUpSummary,
  getExecutiveFollowUpSummary,
  getMissedFollowUpsPreview,
};
