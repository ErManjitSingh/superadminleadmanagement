const Company = require('../superadmin/models/Company');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

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

const getCompanySettings = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.companyId).lean();
  if (!company) throw new ApiError(404, 'Company not found');

  res.json({
    company: {
      id: company._id,
      name: company.name,
      subdomain: company.subdomain,
      primaryDomain: company.primaryDomain,
      timezone: company.timezone,
      currency: company.currency,
      logo: company.logo,
      features: company.features,
    },
    settings: maskSecrets(company.tenantSettings || {}),
  });
});

const updateCompanySettings = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.companyId);
  if (!company) throw new ApiError(404, 'Company not found');

  const { tenantSettings, primaryDomain, timezone, currency, logo } = req.body;

  if (primaryDomain !== undefined) company.primaryDomain = primaryDomain || null;
  if (timezone) company.timezone = timezone;
  if (currency) company.currency = currency;
  if (logo !== undefined) company.logo = logo;

  if (tenantSettings && typeof tenantSettings === 'object') {
    company.tenantSettings = company.tenantSettings || {};
    for (const [key, value] of Object.entries(tenantSettings)) {
      if (value === '••••••••') continue;
      company.tenantSettings[key] = value;
    }
    company.markModified('tenantSettings');
  }

  await company.save();

  res.json({
    company: {
      id: company._id,
      name: company.name,
      subdomain: company.subdomain,
      primaryDomain: company.primaryDomain,
      timezone: company.timezone,
      currency: company.currency,
      logo: company.logo,
    },
    settings: maskSecrets(company.tenantSettings || {}),
  });
});

module.exports = { getCompanySettings, updateCompanySettings };
