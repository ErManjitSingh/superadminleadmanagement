const Company = require('../superadmin/models/Company');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const {
  formatDomainFields,
  connectCustomDomain,
  verifyCustomDomain,
  disconnectCustomDomain,
  refreshDomainStatus,
} = require('../services/domainService');

const getCompanyDomainStatus = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.companyId).lean();
  if (!company) throw new ApiError(404, 'Company not found');
  res.json({ data: formatDomainFields(company) });
});

const verifyCompanyDomain = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.companyId);
  if (!company) throw new ApiError(404, 'Company not found');

  const result = await verifyCustomDomain(company, { actor: req.user, req });
  res.json({
    ...result,
    verified: result.verified,
    company: formatDomainFields(company.toObject()),
  });
});

const connectCompanyDomain = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.companyId);
  if (!company) throw new ApiError(404, 'Company not found');

  const domain = req.body?.customDomain || req.body?.primaryDomain;
  const { company: updated } = await connectCustomDomain(company, domain, {
    verify: Boolean(req.body?.verify),
    actor: req.user,
    req,
  });

  res.json({ company: formatDomainFields(updated.toObject()) });
});

const disconnectCompanyDomain = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.companyId);
  if (!company) throw new ApiError(404, 'Company not found');

  const { company: updated } = await disconnectCustomDomain(company, {
    actor: req.user,
    req,
  });
  res.json({ company: formatDomainFields(updated.toObject()) });
});

const refreshCompanyDomainStatus = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.companyId);
  if (!company) throw new ApiError(404, 'Company not found');

  const result = await refreshDomainStatus(company, { actor: req.user, req });
  res.json({
    ...result,
    company: formatDomainFields(company.toObject()),
  });
});

module.exports = {
  getCompanyDomainStatus,
  verifyCompanyDomain,
  connectCompanyDomain,
  disconnectCompanyDomain,
  refreshCompanyDomainStatus,
};
