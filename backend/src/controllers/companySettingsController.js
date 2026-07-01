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
    ownerEmailVerified: Boolean(company.ownerEmailVerified),
    trialEndDate: company.trialEndDate,
    whiteLabel: company.whiteLabel || {},
    features: company.features,
    additionalDomains: company.additionalDomains || [],
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

  const { tenantSettings, timezone, currency, logo, whiteLabel, businessType, phone, country } = req.body;

  if (timezone) company.timezone = timezone;
  if (currency) company.currency = currency;
  if (logo !== undefined) {
    company.logo = logo;
    if (logo) await markOnboardingStep(company._id, 'logoUploaded', true);
  }
  if (businessType) company.businessType = businessType;
  if (phone) company.phone = phone;
  if (country) company.country = country;

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
      company.tenantSettings[key] = value;
    }
    company.markModified('tenantSettings');
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

module.exports = {
  getCompanySettings,
  getOnboarding,
  updateCompanySettings,
  verifyCompanyDomain,
  updateCompanyDomain,
  removeCompanyDomain,
  resendVerification,
};
