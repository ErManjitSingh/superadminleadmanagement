const Company = require('../models/Company');
const ApiError = require('../../utils/apiError');
const asyncHandler = require('../../utils/asyncHandler');
const { parsePagination, paginatedResponse } = require('../../utils/pagination');
const { logPlatformAudit } = require('../services/platformAuditService');
const {
  formatDomainFields,
  connectCustomDomain,
  verifyCustomDomain,
  disconnectCustomDomain,
  refreshDomainStatus,
} = require('../../services/domainService');

function formatDomainRow(c) {
  const domain = formatDomainFields(c);
  return {
    id: c._id,
    companyId: c._id,
    companyName: c.name,
    ownerName: c.ownerName,
    subdomain: c.subdomain,
    ...domain,
    status: c.status,
    ownerEmail: c.ownerEmail,
    createdAt: c.createdAt,
  };
}

const listDomains = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 20 });
  const filter = { deletedAt: null };
  if (req.query.verified === 'true') filter.domainStatus = 'verified';
  if (req.query.verified === 'false') filter.domainStatus = { $in: ['pending', 'failed'] };
  if (req.query.domainStatus) filter.domainStatus = req.query.domainStatus;
  if (req.query.sslStatus) filter.sslStatus = req.query.sslStatus;
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
    primaryDomain: { $ne: null },
    domainStatus: { $in: ['pending', 'failed'] },
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  res.json({ data: companies.map(formatDomainRow) });
});

const getCompanyDomain = asyncHandler(async (req, res) => {
  const company = await Company.findOne({ _id: req.params.id, deletedAt: null }).lean();
  if (!company) throw new ApiError(404, 'Company not found');
  res.json({ data: formatDomainRow(company) });
});

const connectCompanyDomain = asyncHandler(async (req, res) => {
  const company = await Company.findOne({ _id: req.params.id, deletedAt: null });
  if (!company) throw new ApiError(404, 'Company not found');

  const domain = req.body.customDomain || req.body.primaryDomain;
  await connectCustomDomain(company, domain, {
    verify: Boolean(req.body.verify),
    actor: req.superAdmin,
    req,
  });
  company.updatedBy = req.superAdmin._id;
  await company.save();

  res.json({ company: formatDomainRow(company.toObject()) });
});

const verifyCompanyDomain = asyncHandler(async (req, res) => {
  const company = await Company.findOne({ _id: req.params.id, deletedAt: null });
  if (!company) throw new ApiError(404, 'Company not found');
  if (!company.primaryDomain) throw new ApiError(400, 'Company has no custom domain');

  const result = await verifyCustomDomain(company, { actor: req.superAdmin, req });
  company.updatedBy = req.superAdmin._id;
  await company.save();

  res.json(result);
});

const refreshCompanyDomain = asyncHandler(async (req, res) => {
  const company = await Company.findOne({ _id: req.params.id, deletedAt: null });
  if (!company) throw new ApiError(404, 'Company not found');

  const result = await refreshDomainStatus(company, { actor: req.superAdmin, req });
  company.updatedBy = req.superAdmin._id;
  await company.save();

  res.json({ ...result, company: formatDomainRow(company.toObject()) });
});

const disconnectCompanyDomain = asyncHandler(async (req, res) => {
  const company = await Company.findOne({ _id: req.params.id, deletedAt: null });
  if (!company) throw new ApiError(404, 'Company not found');

  await disconnectCustomDomain(company, { actor: req.superAdmin, req });
  company.updatedBy = req.superAdmin._id;
  await company.save();

  res.json({ company: formatDomainRow(company.toObject()) });
});

const updateCompanyDomain = asyncHandler(async (req, res) => {
  const company = await Company.findOne({ _id: req.params.id, deletedAt: null });
  if (!company) throw new ApiError(404, 'Company not found');

  const domain = req.body.customDomain || req.body.primaryDomain;
  await connectCustomDomain(company, domain, {
    verify: Boolean(req.body.verify),
    actor: req.superAdmin,
    req,
  });
  company.updatedBy = req.superAdmin._id;
  await company.save();

  await logPlatformAudit({
    actor: req.superAdmin,
    action: 'domain_update',
    resourceType: 'company_domain',
    resourceId: company._id,
    companyId: company._id,
    metadata: { domain: company.primaryDomain },
    req,
  });

  res.json({ company: formatDomainRow(company) });
});

module.exports = {
  listDomains,
  listPendingDns,
  getCompanyDomain,
  connectCompanyDomain,
  verifyCompanyDomain,
  refreshCompanyDomain,
  disconnectCompanyDomain,
  updateCompanyDomain,
};
