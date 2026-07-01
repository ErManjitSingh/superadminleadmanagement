const SubscriptionPlan = require('../superadmin/models/SubscriptionPlan');
const { provisionCompany } = require('../superadmin/services/companyProvisioningService');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { generateToken, formatUserResponse, getRestrictedSessionMeta } = require('../middleware/auth');
const { resolveUserPermissions } = require('../services/permissionsService');
const { assertCompanyAccessible } = require('../services/tenantResolveService');

const listPublicPlans = asyncHandler(async (req, res) => {
  const plans = await SubscriptionPlan.find({ deletedAt: null, status: 'active', slug: { $ne: 'custom' } })
    .sort({ sortOrder: 1 })
    .select('name slug description monthlyPrice yearlyPrice userLimit storageLimitGb features')
    .lean();
  res.json({ data: plans });
});

const publicSignup = asyncHandler(async (req, res) => {
  const {
    companyName,
    ownerName,
    ownerEmail,
    password,
    phone,
    planSlug,
    subdomain,
    country,
  } = req.body;

  if (!companyName?.trim() || !ownerName?.trim() || !ownerEmail?.trim() || !password) {
    throw new ApiError(400, 'Company name, owner name, email and password are required');
  }
  if (password.length < 8) throw new ApiError(400, 'Password must be at least 8 characters');

  const plan = await SubscriptionPlan.findOne({
    slug: planSlug || 'starter',
    deletedAt: null,
    status: 'active',
  });
  if (!plan) throw new ApiError(400, 'Invalid plan selected');

  const result = await provisionCompany({
    payload: {
      name: companyName,
      ownerName,
      ownerEmail,
      ownerPassword: password,
      phone,
      subdomain,
      country,
      subscriptionPlanId: plan._id,
      status: 'trial',
      trialDays: 14,
    },
    superAdminId: null,
  });

  const check = assertCompanyAccessible(result.company);
  if (!check.ok) throw new ApiError(check.code, check.message);

  const User = require('../models/User');
  const user = await User.findById(result.adminUser.id);
  const permissions = await resolveUserPermissions(user);

  res.status(201).json({
    ...formatUserResponse(user, permissions),
    token: generateToken(user._id, user.role),
    ...getRestrictedSessionMeta(user.role),
    company: {
      id: result.company._id,
      name: result.company.name,
      subdomain: result.company.subdomain,
      status: result.company.status,
    },
  });
});

module.exports = { listPublicPlans, publicSignup };
