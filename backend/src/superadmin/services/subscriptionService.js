const { mergeFeatures } = require('../../config/featureFlags');

// Plan feature array (['crm','bookings',...]) -> per-tenant boolean feature map.
function planFeaturesToFlags(planFeatures = []) {
  const flags = {};
  for (const key of planFeatures) flags[key] = true;
  return flags;
}

function addBillingPeriod(fromDate, cycle = 'monthly', units = 1) {
  const base = fromDate instanceof Date ? new Date(fromDate) : new Date();
  const next = new Date(base);
  if (cycle === 'yearly') {
    next.setFullYear(next.getFullYear() + units);
  } else {
    next.setMonth(next.getMonth() + units);
  }
  return next;
}

// Extend from whichever is later: now or the current renew date (so paying early
// stacks time rather than losing it).
function computeExtendedRenewDate(company, cycle = 'monthly', units = 1) {
  const now = new Date();
  const current = company.renewDate && company.renewDate > now ? company.renewDate : now;
  return addBillingPeriod(current, cycle, units);
}

function planAmount(plan, cycle = 'monthly') {
  if (!plan) return 0;
  return cycle === 'yearly' ? plan.yearlyPrice || 0 : plan.monthlyPrice || 0;
}

// Apply a plan to a company doc (mutates, does not save). Optionally syncs the
// per-tenant feature flags from the plan's feature list.
function applyPlanToCompany(company, plan, { syncFeatures = true, billingCycle } = {}) {
  company.subscriptionPlanId = plan._id;
  company.storageLimitGb = plan.storageLimitGb;
  if (billingCycle) company.billingCycle = billingCycle;
  if (syncFeatures && Array.isArray(plan.features)) {
    company.features = mergeFeatures(company.features || {}, planFeaturesToFlags(plan.features));
    company.markModified('features');
  }
}

module.exports = {
  planFeaturesToFlags,
  addBillingPeriod,
  computeExtendedRenewDate,
  planAmount,
  applyPlanToCompany,
};
