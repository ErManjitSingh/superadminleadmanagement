const Company = require('../superadmin/models/Company');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const {
  domainPointsToPlatform,
  normalizeDomain,
} = require('../controllers/publicDomainController');
const { onDomainVerified } = require('../services/sslProvisioningService');
const { markOnboardingStep, formatOnboardingResponse, checkProfileCompleted } = require('../services/onboardingService');
const { sendOwnerVerificationEmail } = require('../services/emailVerificationService');
const { platformDomain } = require('../config/branding');

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
    subdomainUrl: `https://${company.subdomain}.${platformDomain}`,
    primaryDomain: company.primaryDomain,
    domainType: company.domainType,
    domainVerified: Boolean(company.domainVerified),
    domainLastVerifiedAt: company.domainLastVerifiedAt,
    sslStatus: company.sslStatus,
    sslLastCheckedAt: company.sslLastCheckedAt,
    additionalDomains: company.additionalDomains || [],
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
  if (!company.primaryDomain) throw new ApiError(400, 'No custom domain configured');

  const result = await domainPointsToPlatform(company.primaryDomain);
  company.domainVerified = result.verified;
  company.domainLastVerifiedAt = new Date();
  if (result.verified) {
    company.status = company.status === 'pending_verification' && !company.ownerEmailVerified
      ? company.status
      : (company.status === 'inactive' ? 'trial' : company.status);
    await markOnboardingStep(company._id, 'domainConnected', true);
    const ssl = await onDomainVerified(company);
    return res.json({
      domain: company.primaryDomain,
      verified: true,
      status: 'verified',
      method: result.method,
      sslStatus: ssl.status,
      domainLastVerifiedAt: company.domainLastVerifiedAt,
    });
  }

  company.domainVerified = false;
  await company.save();
  res.json({
    domain: company.primaryDomain,
    verified: false,
    status: 'pending',
    method: result.method,
    sslStatus: company.sslStatus,
  });
});

const updateCompanyDomain = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.companyId);
  if (!company) throw new ApiError(404, 'Company not found');

  const domain = normalizeDomain(req.body.primaryDomain);
  if (!domain) throw new ApiError(400, 'Valid domain required');

  const taken = await Company.findOne({
    primaryDomain: domain,
    _id: { $ne: company._id },
    deletedAt: null,
  });
  if (taken) throw new ApiError(409, 'Domain already in use');

  company.primaryDomain = domain;
  company.domainType = 'custom';
  company.domainVerified = false;
  company.sslStatus = 'pending';
  company.domainLastVerifiedAt = null;

  if (req.body.verify) {
    const result = await domainPointsToPlatform(domain);
    company.domainVerified = result.verified;
    company.domainLastVerifiedAt = new Date();
    if (result.verified) {
      await markOnboardingStep(company._id, 'domainConnected', true);
      await onDomainVerified(company);
    }
  }

  await company.save();
  res.json({ company: formatCompanyPublic(company.toObject()) });
});

const removeCompanyDomain = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.companyId);
  if (!company) throw new ApiError(404, 'Company not found');

  company.primaryDomain = null;
  company.domainType = 'subdomain';
  company.domainVerified = true;
  company.sslStatus = 'not_applicable';
  company.domainLastVerifiedAt = null;
  await company.save();

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
