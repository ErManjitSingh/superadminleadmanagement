const Company = require('../models/Company');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const SuperAdmin = require('../models/SuperAdmin');
const PlatformAuditLog = require('../models/PlatformAuditLog');
const CompanyLoginLog = require('../models/CompanyLoginLog');
const User = require('../../models/User');
const { getDbStatus } = require('../../config/db');

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

async function getDashboardMetrics() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const baseFilter = { deletedAt: null };

  const [
    totalCompanies,
    activeCompanies,
    inactiveCompanies,
    suspendedCompanies,
    trialCompanies,
    expiredCompanies,
    newCompaniesToday,
    upcomingRenewals,
    expiringTrials,
    totalCompanyUsers,
    recentCompanies,
    recentAuditLogs,
    recentLoginLogs,
    plans,
  ] = await Promise.all([
    Company.countDocuments(baseFilter),
    Company.countDocuments({ ...baseFilter, status: 'active' }),
    Company.countDocuments({ ...baseFilter, status: 'inactive' }),
    Company.countDocuments({ ...baseFilter, status: 'suspended' }),
    Company.countDocuments({ ...baseFilter, status: 'trial' }),
    Company.countDocuments({ ...baseFilter, status: 'expired' }),
    Company.countDocuments({ ...baseFilter, createdAt: { $gte: todayStart, $lte: todayEnd } }),
    Company.countDocuments({ ...baseFilter, renewDate: { $gte: now, $lte: in30Days }, status: { $in: ['active', 'trial'] } }),
    Company.countDocuments({ ...baseFilter, trialEndDate: { $gte: now, $lte: in7Days }, status: 'trial' }),
    User.countDocuments({ companyId: { $ne: null }, status: { $ne: 'disabled' } }),
    Company.find(baseFilter)
      .sort({ createdAt: -1 })
      .limit(8)
      .select('name slug status ownerEmail createdAt subscriptionPlanId')
      .populate('subscriptionPlanId', 'name slug')
      .lean(),
    PlatformAuditLog.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
    CompanyLoginLog.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('companyId', 'name slug')
      .lean(),
    SubscriptionPlan.find({ deletedAt: null, status: 'active' }).lean(),
  ]);

  const companiesWithPlans = await Company.find(baseFilter)
    .select('subscriptionPlanId status')
    .populate('subscriptionPlanId', 'monthlyPrice yearlyPrice slug')
    .lean();

  let monthlyRevenue = 0;
  let yearlyRevenue = 0;
  const planBreakdown = {};

  for (const c of companiesWithPlans) {
    if (!c.subscriptionPlanId || !['active', 'trial'].includes(c.status)) continue;
    const plan = c.subscriptionPlanId;
    monthlyRevenue += plan.monthlyPrice || 0;
    yearlyRevenue += plan.yearlyPrice || 0;
    const key = plan.slug || 'unknown';
    planBreakdown[key] = (planBreakdown[key] || 0) + 1;
  }

  const storageAgg = await Company.aggregate([
    { $match: baseFilter },
    {
      $group: {
        _id: null,
        totalUsedMb: { $sum: '$storageUsedMb' },
        totalLimitGb: { $sum: '$storageLimitGb' },
      },
    },
  ]);

  const storage = storageAgg[0] || { totalUsedMb: 0, totalLimitGb: 0 };
  const db = getDbStatus();

  const registrationTrend = await Company.aggregate([
    { $match: { ...baseFilter, createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return {
    metrics: {
      totalCompanies,
      activeCompanies,
      inactiveCompanies,
      suspendedCompanies,
      trialCompanies,
      expiredCompanies,
      newCompaniesToday,
      upcomingRenewals,
      expiringTrials,
      totalCompanyUsers,
      monthlyRevenue,
      yearlyRevenue,
      storageUsedMb: storage.totalUsedMb,
      storageLimitGb: storage.totalLimitGb,
    },
    serverStatus: {
      database: db,
      api: { status: 'ok', timestamp: now.toISOString() },
    },
    recentCompanies,
    platformActivity: recentAuditLogs,
    auditLogs: recentAuditLogs,
    loginLogs: recentLoginLogs,
    subscriptionSummary: {
      planBreakdown,
      plans: plans.map((p) => ({
        id: p._id,
        name: p.name,
        slug: p.slug,
        monthlyPrice: p.monthlyPrice,
        yearlyPrice: p.yearlyPrice,
        status: p.status,
      })),
    },
    registrationTrend: registrationTrend.map((r) => ({ date: r._id, count: r.count })),
  };
}

module.exports = { getDashboardMetrics };
