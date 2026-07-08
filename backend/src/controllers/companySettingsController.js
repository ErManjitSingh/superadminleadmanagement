const Company = require('../superadmin/models/Company');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { markOnboardingStep, formatOnboardingResponse, checkProfileCompleted } = require('../services/onboardingService');
const { sendOwnerVerificationEmail } = require('../services/emailVerificationService');
const {
  formatDomainFields,
  connectCustomDomain,
  verifyCustomDomain,
  disconnectCustomDomain,
} = require('../services/domainService');
const { getSubscriptionStatus } = require('../services/subscriptionLimitsService');
const { clearTenantTransporterCache } = require('../services/emailService');
const { encrypt, isEncrypted } = require('../utils/secretCrypto');
const { createUpgradeRequest } = require('../services/upgradeRequestService');
const SubscriptionPlan = require('../superadmin/models/SubscriptionPlan');
const PlatformPaymentRequest = require('../superadmin/models/PlatformPaymentRequest');
const { getSettingValue } = require('../superadmin/services/platformSettingsService');
const { planAmount } = require('../superadmin/services/subscriptionService');
const { createPaymentRequestFromTenant } = require('../superadmin/controllers/paymentRequestController');

function maskSecrets(settings = {}) {
  const copy = { ...settings };
  if (copy.smtpPass) {
    copy.smtpPass = '••••••••';
    copy.hasSmtpPass = true;
  }
  if (copy.whatsappApiKey) {
    copy.whatsappApiKey = '••••••••';
    copy.hasWhatsappApiKey = true;
  }
  if (copy.cloudinaryApiKey) {
    copy.cloudinaryApiKey = '••••••••';
    copy.hasCloudinaryApiKey = true;
  }
  return copy;
}

function formatCompanyPublic(company) {
  return {
    id: company._id,
    name: company.name,
    subdomain: company.subdomain,
    timezone: company.timezone,
    currency: company.currency,
    logo: company.logo,
    businessType: company.businessType,
    country: company.country,
    status: company.status,
    ownerEmail: company.ownerEmail,
    ownerEmailVerified: Boolean(company.ownerEmailVerified),
    trialEndDate: company.trialEndDate,
    whiteLabel: company.whiteLabel || {},
    features: company.features,
    additionalDomains: company.additionalDomains || [],
    // Public-facing company profile (used on quotation / invoice PDFs).
    phone: company.phone || '',
    state: company.state || '',
    city: company.city || '',
    address: company.address || '',
    gst: company.gst || '',
    tagline: company.tagline || '',
    website: company.website || '',
    quotesEmail: company.quotesEmail || '',
    bankAccounts: company.bankAccounts || [],
    upiId: company.upiId || '',
    upiName: company.upiName || '',
    ...formatDomainFields(company),
  };
}

const getCompanySettings = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.companyId).lean();
  if (!company) throw new ApiError(404, 'Company not found');

  res.json({
    company: formatCompanyPublic(company),
    settings: maskSecrets(company.tenantSettings || {}),
    onboarding: formatOnboardingResponse(company),
  });
});

const getOnboarding = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.companyId).lean();
  if (!company) throw new ApiError(404, 'Company not found');
  res.json({ data: formatOnboardingResponse(company) });
});

const updateCompanySettings = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.companyId);
  if (!company) throw new ApiError(404, 'Company not found');

  const {
    tenantSettings,
    timezone,
    currency,
    logo,
    whiteLabel,
    businessType,
    phone,
    country,
    name,
    tagline,
    website,
    quotesEmail,
    address,
    city,
    state,
    gst,
    bankAccounts,
    upiId,
    upiName,
  } = req.body;

  if (timezone) company.timezone = timezone;
  if (currency) company.currency = currency;
  if (logo !== undefined) {
    company.logo = logo;
    if (logo) await markOnboardingStep(company._id, 'logoUploaded', true);
  }
  if (businessType) company.businessType = businessType;
  if (phone !== undefined) company.phone = phone;
  if (country) company.country = country;

  if (name !== undefined && String(name).trim()) company.name = String(name).trim();
  if (tagline !== undefined) company.tagline = tagline;
  if (website !== undefined) company.website = website;
  if (quotesEmail !== undefined) company.quotesEmail = quotesEmail;
  if (address !== undefined) company.address = address;
  if (city !== undefined) company.city = city;
  if (state !== undefined) company.state = state;
  if (gst !== undefined) company.gst = gst;
  if (upiId !== undefined) company.upiId = upiId;
  if (upiName !== undefined) company.upiName = upiName;
  if (Array.isArray(bankAccounts)) {
    company.bankAccounts = bankAccounts
      .filter((b) => b && (b.bank || b.accountNo || b.upi))
      .map((b) => ({
        bank: b.bank || '',
        accountName: b.accountName || '',
        accountNo: b.accountNo || '',
        ifsc: b.ifsc || '',
        branch: b.branch || '',
        upi: b.upi || '',
      }));
    company.markModified('bankAccounts');
  }

  if (whiteLabel && typeof whiteLabel === 'object') {
    company.whiteLabel = { ...(company.whiteLabel || {}), ...whiteLabel };
    company.markModified('whiteLabel');
    if (whiteLabel.appTitle) {
      company.tenantSettings = company.tenantSettings || {};
      company.tenantSettings.brandLogoUrl = whiteLabel.brandLogoUrl || company.tenantSettings.brandLogoUrl;
    }
  }

  if (tenantSettings && typeof tenantSettings === 'object') {
    company.tenantSettings = company.tenantSettings || {};
    for (const [key, value] of Object.entries(tenantSettings)) {
      if (value === '••••••••') continue;
      if (key === 'smtpPass' && value && !isEncrypted(value)) {
        company.tenantSettings[key] = encrypt(value);
      } else {
        company.tenantSettings[key] = value;
      }
    }
    company.markModified('tenantSettings');
    clearTenantTransporterCache(company._id);
  }

  await company.save();
  await checkProfileCompleted(company);

  res.json({
    company: formatCompanyPublic(company.toObject()),
    settings: maskSecrets(company.tenantSettings || {}),
    onboarding: formatOnboardingResponse(company),
  });
});

const verifyCompanyDomain = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.companyId);
  if (!company) throw new ApiError(404, 'Company not found');

  const result = await verifyCustomDomain(company, { actor: req.user, req });
  res.json({
    ...result,
    company: formatCompanyPublic(company.toObject()),
  });
});

const updateCompanyDomain = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.companyId);
  if (!company) throw new ApiError(404, 'Company not found');

  const domain = req.body.customDomain || req.body.primaryDomain;
  await connectCustomDomain(company, domain, {
    verify: Boolean(req.body.verify),
    actor: req.user,
    req,
  });

  res.json({ company: formatCompanyPublic(company.toObject()) });
});

const removeCompanyDomain = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.companyId);
  if (!company) throw new ApiError(404, 'Company not found');

  await disconnectCustomDomain(company, { actor: req.user, req });
  res.json({ company: formatCompanyPublic(company.toObject()) });
});

const resendVerification = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.companyId);
  if (!company) throw new ApiError(404, 'Company not found');
  if (company.ownerEmailVerified) {
    return res.json({ sent: false, message: 'Email already verified' });
  }
  const result = await sendOwnerVerificationEmail(company);
  res.json({ sent: result.sent, message: result.sent ? 'Verification email sent' : 'Could not send email — contact support' });
});

const getSubscriptionLimits = asyncHandler(async (req, res) => {
  const status = await getSubscriptionStatus(req.companyId);
  if (!status) throw new ApiError(404, 'Company not found');
  res.json({ data: status });
});

// Renewal / payment info for the tenant: platform UPI ID + amount due for the
// company's current (or a chosen) plan + billing cycle.
const getRenewalInfo = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.companyId).populate('subscriptionPlanId').lean();
  if (!company) throw new ApiError(404, 'Company not found');

  const [upiId, upiName] = await Promise.all([
    getSettingValue('billing_upi_id'),
    getSettingValue('billing_upi_name'),
  ]);

  let plan = company.subscriptionPlanId && typeof company.subscriptionPlanId === 'object'
    ? company.subscriptionPlanId
    : null;

  if (req.query.planId) {
    const chosen = await SubscriptionPlan.findOne({ _id: req.query.planId, deletedAt: null }).lean();
    if (chosen) plan = chosen;
  }

  const billingCycle = req.query.billingCycle || company.billingCycle || 'monthly';
  const amount = planAmount(plan, billingCycle);

  const pendingRequest = await PlatformPaymentRequest.findOne({
    companyId: company._id,
    status: 'submitted',
  })
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    data: {
      upiId: upiId || '',
      upiName: upiName || '',
      configured: Boolean(upiId),
      plan: plan ? { id: plan._id, name: plan.name, slug: plan.slug } : null,
      billingCycle,
      amount,
      currency: company.currency || 'INR',
      status: company.status,
      renewDate: company.renewDate,
      trialEndDate: company.trialEndDate,
      pendingRequest: pendingRequest
        ? {
            id: pendingRequest._id,
            amount: pendingRequest.amount,
            referenceNumber: pendingRequest.referenceNumber,
            createdAt: pendingRequest.createdAt,
          }
        : null,
    },
  });
});

// Tenant admin submits proof of a UPI payment (transaction reference / UTR).
const submitRenewalPayment = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.companyId);
  if (!company) throw new ApiError(404, 'Company not found');

  const { referenceNumber, planId, billingCycle, note } = req.body || {};
  if (!referenceNumber || !String(referenceNumber).trim()) {
    throw new ApiError(400, 'Please enter the UPI transaction reference number');
  }

  const existing = await PlatformPaymentRequest.findOne({ companyId: company._id, status: 'submitted' });
  if (existing) {
    throw new ApiError(400, 'A payment is already under review. Please wait for confirmation.');
  }

  let plan = null;
  const planLookupId = planId || company.subscriptionPlanId;
  if (planLookupId) {
    plan = await SubscriptionPlan.findOne({ _id: planLookupId, deletedAt: null }).lean();
  }

  const cycle = billingCycle || company.billingCycle || 'monthly';
  const amount = planAmount(plan, cycle);
  const upiId = await getSettingValue('billing_upi_id');

  const request = await createPaymentRequestFromTenant({
    company,
    user: req.user,
    plan,
    billingCycle: cycle,
    amount,
    upiId,
    referenceNumber: String(referenceNumber).trim(),
    payerNote: note ? String(note).trim() : '',
  });

  res.status(201).json({
    data: {
      id: request._id,
      status: request.status,
      message: 'Payment submitted. Your plan will be extended once our team confirms it.',
    },
  });
});

const requestPlanUpgrade = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.companyId);
  if (!company) throw new ApiError(404, 'Company not found');

  const { targetPlanSlug, message } = req.body || {};
  const result = await createUpgradeRequest(company, req.user, { targetPlanSlug, message });

  res.status(result.alreadyOpen ? 200 : 201).json({
    data: {
      ticketNumber: result.ticket.ticketNumber,
      alreadyOpen: result.alreadyOpen,
      message: result.alreadyOpen
        ? 'An upgrade request is already open — our team will contact you soon.'
        : 'Upgrade request submitted. Our team will contact you shortly.',
    },
  });
});

module.exports = {
  getCompanySettings,
  getOnboarding,
  getSubscriptionLimits,
  requestPlanUpgrade,
  getRenewalInfo,
  submitRenewalPayment,
  updateCompanySettings,
  verifyCompanyDomain,
  updateCompanyDomain,
  removeCompanyDomain,
  resendVerification,
};
