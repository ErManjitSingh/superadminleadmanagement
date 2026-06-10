const EmailLog = require('../models/EmailLog');
const { withBranch } = require('../utils/branchScope');

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

async function getEmailDashboardStats({ branchId, userId = null } = {}) {
  const { start, end } = todayRange();
  const base = withBranch({}, branchId);
  if (userId) base.sentBy = userId;

  const todayFilter = { ...base, createdAt: { $gte: start, $lte: end } };

  const [sentToday, failedToday, quotationEmails, followUpEmails] = await Promise.all([
    EmailLog.countDocuments({ ...todayFilter, status: 'sent' }),
    EmailLog.countDocuments({ ...todayFilter, status: 'failed' }),
    EmailLog.countDocuments({ ...todayFilter, category: 'quotation', status: 'sent' }),
    EmailLog.countDocuments({ ...todayFilter, category: 'follow_up', status: 'sent' }),
  ]);

  return {
    sentToday,
    failedToday,
    quotationEmails,
    followUpEmails,
  };
}

module.exports = { getEmailDashboardStats };
