const SubscriptionPlan = require('../models/SubscriptionPlan');
const ApiError = require('../../utils/apiError');
const asyncHandler = require('../../utils/asyncHandler');
const { logPlatformAudit } = require('../services/platformAuditService');

function formatPlan(plan) {
  const p = plan.toObject ? plan.toObject() : plan;
  return {
    id: p._id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    monthlyPrice: p.monthlyPrice,
    yearlyPrice: p.yearlyPrice,
    userLimit: p.userLimit,
    branchLimit: p.branchLimit,
    storageLimitGb: p.storageLimitGb,
    leadLimit: p.leadLimit,
    bookingLimit: p.bookingLimit,
    features: p.features,
    status: p.status,
    isCustom: p.isCustom,
    sortOrder: p.sortOrder,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

const listPlans = asyncHandler(async (req, res) => {
  const plans = await SubscriptionPlan.find({ deletedAt: null })
    .sort({ sortOrder: 1, monthlyPrice: 1 });
  res.json({ data: plans.map(formatPlan) });
});

const getPlan = asyncHandler(async (req, res) => {
  const plan = await SubscriptionPlan.findOne({ _id: req.params.id, deletedAt: null });
  if (!plan) throw new ApiError(404, 'Plan not found');
  res.json({ plan: formatPlan(plan) });
});

const createPlan = asyncHandler(async (req, res) => {
  const existing = await SubscriptionPlan.findOne({ slug: req.body.slug, deletedAt: null });
  if (existing) throw new ApiError(409, 'Plan slug already exists');

  const plan = await SubscriptionPlan.create({
    ...req.body,
    createdBy: req.superAdmin._id,
    updatedBy: req.superAdmin._id,
  });

  await logPlatformAudit({
    actor: req.superAdmin,
    action: 'create',
    resourceType: 'subscription_plan',
    resourceId: plan._id,
    req,
  });

  res.status(201).json({ plan: formatPlan(plan) });
});

const updatePlan = asyncHandler(async (req, res) => {
  const plan = await SubscriptionPlan.findOne({ _id: req.params.id, deletedAt: null });
  if (!plan) throw new ApiError(404, 'Plan not found');

  const allowed = [
    'name', 'description', 'monthlyPrice', 'yearlyPrice', 'userLimit', 'branchLimit',
    'storageLimitGb', 'leadLimit', 'bookingLimit', 'features', 'status', 'sortOrder',
  ];
  for (const key of allowed) {
    if (req.body[key] !== undefined) plan[key] = req.body[key];
  }
  plan.updatedBy = req.superAdmin._id;
  await plan.save();

  await logPlatformAudit({
    actor: req.superAdmin,
    action: 'update',
    resourceType: 'subscription_plan',
    resourceId: plan._id,
    req,
  });

  res.json({ plan: formatPlan(plan) });
});

const deletePlan = asyncHandler(async (req, res) => {
  const plan = await SubscriptionPlan.findOne({ _id: req.params.id, deletedAt: null });
  if (!plan) throw new ApiError(404, 'Plan not found');
  if (['starter', 'professional', 'business', 'enterprise'].includes(plan.slug)) {
    throw new ApiError(400, 'Cannot delete system plan');
  }

  plan.deletedAt = new Date();
  plan.status = 'inactive';
  await plan.save();

  res.json({ message: 'Plan deleted' });
});

module.exports = { listPlans, getPlan, createPlan, updatePlan, deletePlan };
