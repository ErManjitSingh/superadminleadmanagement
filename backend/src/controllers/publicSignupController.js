const SubscriptionPlan = require("../superadmin/models/SubscriptionPlan");
const {
  provisionCompany,
  slugify,
} = require("../superadmin/services/companyProvisioningService");
const {
  domainPointsToPlatform,
  normalizeDomain,
} = require("../controllers/publicDomainController");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const {
  generateToken,
  formatUserResponse,
  getRestrictedSessionMeta,
} = require("../middleware/auth");
const { resolveUserPermissions } = require("../services/permissionsService");
const { assertCompanyAccessible } = require("../services/tenantResolveService");
const { platformDomain } = require("../config/branding");
const { sendOwnerVerificationEmail } = require("../services/emailVerificationService");
const { onDomainVerified } = require("../services/sslProvisioningService");
const { formatOnboardingResponse } = require("../services/onboardingService");
const { buildDnsInstructions, needsDnsSetup } = require("../services/dnsInstructionsService");
const { formatDomainFields } = require("../services/domainService");

const listPublicPlans = asyncHandler(async (req, res) => {
  const plans = await SubscriptionPlan.find({
    deletedAt: null,
    status: "active",
    slug: { $ne: "custom" },
  })
    .sort({ sortOrder: 1 })
    .select(
      "name slug description monthlyPrice yearlyPrice userLimit storageLimitGb features",
    )
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
    businessType,
    timezone,
    currency,
    primaryDomain,
    domainType,
    domainVerified,
  } = req.body;

  if (
    !companyName?.trim() ||
    !ownerName?.trim() ||
    !ownerEmail?.trim() ||
    !password
  ) {
    throw new ApiError(
      400,
      "Company name, owner name, email and password are required",
    );
  }
  if (password.length < 8)
    throw new ApiError(400, "Password must be at least 8 characters");

  const plan = await SubscriptionPlan.findOne({
    slug: planSlug || "starter",
    deletedAt: null,
    status: "active",
  });
  if (!plan) throw new ApiError(400, "Invalid plan selected");

  const resolvedDomainType = domainType === "custom" ? "custom" : "subdomain";
  let resolvedPrimaryDomain = null;
  let resolvedDomainVerified = resolvedDomainType === "subdomain";

  if (resolvedDomainType === "custom") {
    resolvedPrimaryDomain = normalizeDomain(primaryDomain);
    if (!resolvedPrimaryDomain) {
      throw new ApiError(400, "Custom domain is required");
    }
    if (domainVerified) {
      const check = await domainPointsToPlatform(resolvedPrimaryDomain);
      resolvedDomainVerified = check.verified;
    }
  }

  const normalizedSubdomain = subdomain ? slugify(subdomain) : slugify(companyName);
  if (!normalizedSubdomain || normalizedSubdomain.length < 2) {
    throw new ApiError(400, "A valid workspace subdomain is required");
  }

  const result = await provisionCompany({
    payload: {
      name: companyName,
      ownerName,
      ownerEmail,
      ownerPassword: password,
      phone,
      subdomain: normalizedSubdomain,
      country,
      businessType,
      timezone,
      currency,
      primaryDomain: resolvedPrimaryDomain,
      domainType: resolvedDomainType,
      domainVerified: resolvedDomainVerified,
      subscriptionPlanId: plan._id,
      status: "pending_verification",
      trialDays: 7,
    },
    superAdminId: null,
  });

  if (result.company.domainVerified && result.company.domainType === 'custom') {
    await onDomainVerified(result.company);
  }

  const emailResult = await sendOwnerVerificationEmail(result.company);

  const check = assertCompanyAccessible(result.company);
  if (!check.ok && check.code !== 503) throw new ApiError(check.code, check.message);

  const User = require("../models/User");
  const user = await User.findById(result.adminUser.id);
  const permissions = await resolveUserPermissions(user);

  const domainFields = formatDomainFields(result.company);
  const requiresDnsSetup = needsDnsSetup(result.company);

  res.status(201).json({
    ...formatUserResponse(user, permissions),
    token: generateToken(user._id, user.role),
    ...getRestrictedSessionMeta(user.role),
    company: {
      id: result.company._id,
      name: result.company.name,
      subdomain: result.company.subdomain,
      primaryDomain: result.company.primaryDomain,
      domainType: result.company.domainType,
      domainVerified: result.company.domainVerified,
      domainStatus: result.company.domainStatus,
      sslStatus: result.company.sslStatus,
      status: result.company.status,
      ownerEmailVerified: result.company.ownerEmailVerified,
      workspaceUrl: `https://${result.company.subdomain}.${platformDomain}/app`,
      trialEndDate: result.company.trialEndDate,
      trialDaysRemaining: 7,
      systemDomain: domainFields.systemDomain,
    },
    requiresDnsSetup,
    dnsSetup: requiresDnsSetup ? buildDnsInstructions(result.company.primaryDomain) : null,
    onboarding: formatOnboardingResponse(result.company),
    requiresEmailVerification: !result.company.ownerEmailVerified,
    verificationEmailSent: emailResult.sent,
    branch: result.defaultBranch,
  });
});

module.exports = { listPublicPlans, publicSignup };
