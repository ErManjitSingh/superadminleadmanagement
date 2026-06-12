const EmailLog = require('../models/EmailLog');
const { withBranch } = require('../utils/branchScope');
const { isEmailConfigured } = require('./emailService');
const cacheService = require('./cacheService');

const STATS_TTL_MS = 30_000;

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function facetCount(facet, key) {
  return facet?.[key]?.[0]?.n ?? 0;
}

async function computeEmailDashboardStats({ branchId, userId = null } = {}) {
  const { start, end } = todayRange();
  const base = withBranch({}, branchId);
  if (userId) base.sentBy = userId;

  const todayFilter = { ...base, createdAt: { $gte: start, $lte: end } };

  const [row] = await EmailLog.aggregate([
    { $match: todayFilter },
    {
      $facet: {
        sentToday: [{ $match: { status: 'sent' } }, { $count: 'n' }],
        failedToday: [{ $match: { status: 'failed' } }, { $count: 'n' }],
        quotationEmails: [{ $match: { status: 'sent', category: 'quotation' } }, { $count: 'n' }],
        followUpEmails: [{ $match: { status: 'sent', category: 'follow_up' } }, { $count: 'n' }],
      },
    },
  ]);

  return {
    sentToday: facetCount(row, 'sentToday'),
    failedToday: facetCount(row, 'failedToday'),
    quotationEmails: facetCount(row, 'quotationEmails'),
    followUpEmails: facetCount(row, 'followUpEmails'),
    configured: isEmailConfigured(),
  };
}

async function getEmailDashboardStats({ branchId, userId = null } = {}) {
  const key = `email-stats:${branchId || 'all'}:${userId || 'all'}`;
  return cacheService.getOrSet(
    key,
    () => computeEmailDashboardStats({ branchId, userId }),
    STATS_TTL_MS
  );
}

module.exports = { getEmailDashboardStats };
