const Company = require('../superadmin/models/Company');
const SubscriptionPlan = require('../superadmin/models/SubscriptionPlan');
const User = require('../models/User');
const Branch = require('../models/Branch');
const Lead = require('../models/Lead');
const Booking = require('../models/Booking');
const ApiError = require('../utils/apiError');
const { normalizeCompanyId } = require('../utils/branchScope');
const { daysUntil } = require('./subscriptionNotificationService');
const { listAvailablePlans, hasOpenUpgradeTicket } = require('./upgradeRequestService');

function unlimited(value) {
  return value == null || value <= 0;
}

async function getCompanyWithPlan(companyId) {
  if (!companyId) return null;
  return Company.findOne({ _id: normalizeCompanyId(companyId), deletedAt: null })
    .populate('subscriptionPlanId')
    .lean();
}

function resolveLimits(company) {
  const plan = company?.subscriptionPlanId && typeof company.subscriptionPlanId === 'object'
    ? company.subscriptionPlanId
    : null;

  return {
    userLimit: plan?.userLimit ?? 999,
    branchLimit: plan?.branchLimit ?? 99,
    storageLimitGb: company?.storageLimitGb ?? plan?.storageLimitGb ?? 5,
    storageUsedMb: company?.storageUsedMb ?? 0,
    leadLimit: plan?.leadLimit ?? 0,
    bookingLimit: plan?.bookingLimit ?? 0,
    planName: plan?.name || 'Plan',
  };
}

async function getUsage(companyId) {
  const cid = normalizeCompanyId(companyId);
  const [users, branches, leads, bookings] = await Promise.all([
    User.countDocuments({ companyId: cid, status: { $ne: 'disabled' } }),
    Branch.countDocuments({ companyId: cid, status: 'active' }),
    Lead.countDocuments({ companyId: cid, isDeleted: { $ne: true } }),
    Booking.countDocuments({ companyId: cid, archivedAt: { $exists: false } }),
  ]);
  return { users, branches, leads, bookings };
}

async function getSubscriptionStatus(companyId) {
  const company = await getCompanyWithPlan(companyId);
  if (!company) return null;
  const limits = resolveLimits(company);
  const usage = await getUsage(companyId);

  const daysRemaining = company.status === 'trial' && company.trialEndDate
    ? daysUntil(company.trialEndDate)
    : company.renewDate && ['active', 'trial'].includes(company.status)
      ? daysUntil(company.renewDate)
      : null;

  const pct = (used, limit) => (limit > 0 ? used / limit : 0);
  const nearLimit = {
    users: pct(usage.users, limits.userLimit) >= 0.9,
    branches: pct(usage.branches, limits.branchLimit) >= 0.9,
    leads: !unlimited(limits.leadLimit) && pct(usage.leads, limits.leadLimit) >= 0.9,
    bookings: !unlimited(limits.bookingLimit) && pct(usage.bookings, limits.bookingLimit) >= 0.9,
    storage: limits.storageLimitGb > 0 && (limits.storageUsedMb / (limits.storageLimitGb * 1024)) >= 0.9,
  };

  const [upgradeRequestPending, availablePlans] = await Promise.all([
    hasOpenUpgradeTicket(company._id),
    listAvailablePlans(),
  ]);

  return {
    companyId: company._id,
    planName: limits.planName,
    planSlug: company.subscriptionPlanId?.slug || null,
    status: company.status,
    trialEndDate: company.trialEndDate,
    renewDate: company.renewDate,
    daysRemaining,
    isExpired: company.status === 'expired',
    showTrialWarning: company.status === 'trial' && daysRemaining != null && daysRemaining <= 7,
    upgradeRequestPending: Boolean(upgradeRequestPending),
    nearLimit,
    limits,
    usage,
    availablePlans,
    remaining: {
      users: Math.max(0, limits.userLimit - usage.users),
      branches: Math.max(0, limits.branchLimit - usage.branches),
      leads: unlimited(limits.leadLimit) ? null : Math.max(0, limits.leadLimit - usage.leads),
      bookings: unlimited(limits.bookingLimit) ? null : Math.max(0, limits.bookingLimit - usage.bookings),
      storageMb: Math.max(0, limits.storageLimitGb * 1024 - limits.storageUsedMb),
    },
  };
}

async function assertUserLimit(companyId) {
  if (!companyId) return;
  const company = await getCompanyWithPlan(companyId);
  if (!company) return;
  const limits = resolveLimits(company);
  const count = await User.countDocuments({
    companyId: normalizeCompanyId(companyId),
    status: { $ne: 'disabled' },
  });
  if (count >= limits.userLimit) {
    throw new ApiError(
      403,
      `User limit reached (${limits.userLimit} on ${limits.planName}). Upgrade your plan to add more users.`,
    );
  }
}

async function assertBranchLimit(companyId) {
  if (!companyId) return;
  const company = await getCompanyWithPlan(companyId);
  if (!company) return;
  const limits = resolveLimits(company);
  const count = await Branch.countDocuments({
    companyId: normalizeCompanyId(companyId),
    status: 'active',
  });
  if (count >= limits.branchLimit) {
    throw new ApiError(
      403,
      `Branch limit reached (${limits.branchLimit} on ${limits.planName}). Upgrade your plan to add more branches.`,
    );
  }
}

async function assertLeadLimit(companyId, additional = 1) {
  if (!companyId) return;
  const company = await getCompanyWithPlan(companyId);
  if (!company) return;
  const limits = resolveLimits(company);
  if (unlimited(limits.leadLimit)) return;

  const count = await Lead.countDocuments({
    companyId: normalizeCompanyId(companyId),
    isDeleted: { $ne: true },
  });
  if (count + additional > limits.leadLimit) {
    throw new ApiError(
      403,
      `Lead limit reached (${limits.leadLimit} on ${limits.planName}). Upgrade your plan to add more leads.`,
    );
  }
}

async function assertBookingLimit(companyId, additional = 1) {
  if (!companyId) return;
  const company = await getCompanyWithPlan(companyId);
  if (!company) return;
  const limits = resolveLimits(company);
  if (unlimited(limits.bookingLimit)) return;

  const count = await Booking.countDocuments({
    companyId: normalizeCompanyId(companyId),
    archivedAt: { $exists: false },
  });
  if (count + additional > limits.bookingLimit) {
    throw new ApiError(
      403,
      `Booking limit reached (${limits.bookingLimit} on ${limits.planName}). Upgrade your plan to add more bookings.`,
    );
  }
}

async function assertStorageAvailable(companyId, additionalBytes = 0) {
  if (!companyId || !additionalBytes) return;
  const company = await getCompanyWithPlan(companyId);
  if (!company) return;
  const limits = resolveLimits(company);
  const limitMb = limits.storageLimitGb * 1024;
  const nextMb = limits.storageUsedMb + additionalBytes / (1024 * 1024);
  if (nextMb > limitMb) {
    throw new ApiError(
      403,
      `Storage limit exceeded (${limits.storageLimitGb} GB on ${limits.planName}). Upgrade your plan or free up space.`,
    );
  }
}

async function recordStorageUsage(companyId, additionalBytes = 0) {
  if (!companyId || !additionalBytes) return;
  const mb = additionalBytes / (1024 * 1024);
  await Company.updateOne(
    { _id: normalizeCompanyId(companyId) },
    { $inc: { storageUsedMb: mb } },
  );
}

module.exports = {
  getCompanyWithPlan,
  resolveLimits,
  getUsage,
  getSubscriptionStatus,
  assertUserLimit,
  assertBranchLimit,
  assertLeadLimit,
  assertBookingLimit,
  assertStorageAvailable,
  recordStorageUsage,
};
