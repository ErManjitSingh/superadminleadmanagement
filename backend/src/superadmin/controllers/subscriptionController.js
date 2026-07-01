const Company = require('../models/Company');
const asyncHandler = require('../../utils/asyncHandler');
const { parsePagination, paginatedResponse } = require('../../utils/pagination');

const listSubscriptions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 20 });
  const filter = { deletedAt: null };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.plan) filter.subscriptionPlanId = req.query.plan;

  const [companies, total] = await Promise.all([
    Company.find(filter)
      .sort({ renewDate: 1 })
      .skip(skip)
      .limit(limit)
      .populate('subscriptionPlanId', 'name slug monthlyPrice yearlyPrice')
      .lean(),
    Company.countDocuments(filter),
  ]);

  const rows = companies.map((c) => {
    const plan = c.subscriptionPlanId;
    const billingCycle = c.billingCycle || 'monthly';
    return {
      id: c._id,
      companyId: c._id,
      companyName: c.name,
      plan: plan ? { id: plan._id, name: plan.name, slug: plan.slug } : null,
      billingCycle,
      price: billingCycle === 'yearly' ? plan?.yearlyPrice : plan?.monthlyPrice,
      currency: c.currency || 'INR',
      renewalDate: c.renewDate,
      trialEndDate: c.trialEndDate,
      status: c.status,
      autoRenewal: c.autoRenewal !== false,
    };
  });

  res.json(paginatedResponse(rows, { page, limit, total }));
});

module.exports = { listSubscriptions };
