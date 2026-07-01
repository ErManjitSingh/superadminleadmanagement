const Company = require('../models/Company');
const { domainPointsToPlatform, normalizeDomain } = require('../../controllers/publicDomainController');
const { onDomainVerified } = require('../../services/sslProvisioningService');
const { markOnboardingStep } = require('../../services/onboardingService');
const ApiError = require('../../utils/apiError');
const asyncHandler = require('../../utils/asyncHandler');
const { parsePagination, paginatedResponse } = require('../../utils/pagination');
const { logPlatformAudit } = require('../services/platformAuditService');
const { platformDomain } = require('../../config/branding');

function formatDomainRow(c) {
  return {
    id: c._id,
    companyId: c._id,
    companyName: c.name,
    subdomain: c.subdomain,
    subdomainUrl: `${c.subdomain}.${platformDomain}`,
    primaryDomain: c.primaryDomain,
    domainType: c.domainType || 'subdomain',
    domainVerified: Boolean(c.domainVerified),
    domainLastVerifiedAt: c.domainLastVerifiedAt,
    sslStatus: c.sslStatus || 'not_applicable',
    sslLastCheckedAt: c.sslLastCheckedAt,
    status: c.status,
    ownerEmail: c.ownerEmail,
    createdAt: c.createdAt,
  };
}

const listDomains = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 20 });
  const filter = { deletedAt: null };
  if (req.query.verified === 'true') filter.domainVerified = true;
  if (req.query.verified === 'false') filter.domainVerified = false;
  if (req.query.type === 'custom') filter.primaryDomain = { $ne: null };
  if (req.query.search) {
    const s = req.query.search.trim();
    filter.$or = [
      { name: { $regex: s, $options: 'i' } },
      { subdomain: { $regex: s, $options: 'i' } },
      { primaryDomain: { $regex: s, $options: 'i' } },
    ];
  }

  const [companies, total] = await Promise.all([
    Company.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Company.countDocuments(filter),
  ]);

  res.json(paginatedResponse(companies.map(formatDomainRow), { page, limit, total }));
});

const listPendingDns = asyncHandler(async (req, res) => {
  const companies = await Company.find({
    deletedAt: null,
    domainType: 'custom',
    primaryDomain: { $ne: null },
    domainVerified: false,
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  res.json({ data: companies.map(formatDomainRow) });
});

const verifyCompanyDomain = asyncHandler(async (req, res) => {
  const company = await Company.findOne({ _id: req.params.id, deletedAt: null });
  if (!company) throw new ApiError(404, 'Company not found');
  if (!company.primaryDomain) throw new ApiError(400, 'Company has no custom domain');

  const result = await domainPointsToPlatform(company.primaryDomain);
  company.domainVerified = result.verified;
  company.domainLastVerifiedAt = new Date();
  company.updatedBy = req.superAdmin._id;
  if (result.verified) {
    await markOnboardingStep(company._id, 'domainConnected', true);
    await onDomainVerified(company);
  } else {
    await company.save();
  }

  await logPlatformAudit({
    actor: req.superAdmin,
    action: 'domain_verify',
    resourceType: 'company',
    resourceId: company._id,
    companyId: company._id,
    metadata: { domain: company.primaryDomain, verified: result.verified },
    req,
  });

  res.json({
    domain: company.primaryDomain,
    verified: result.verified,
    status: result.verified ? 'verified' : 'pending',
    method: result.method,
  });
});

const updateCompanyDomain = asyncHandler(async (req, res) => {
  const company = await Company.findOne({ _id: req.params.id, deletedAt: null });
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
  if (req.body.verify) {
    const result = await domainPointsToPlatform(domain);
    company.domainVerified = result.verified;
  }
  company.updatedBy = req.superAdmin._id;
  await company.save();

  res.json({ company: formatDomainRow(company) });
});

module.exports = { listDomains, listPendingDns, verifyCompanyDomain, updateCompanyDomain };
