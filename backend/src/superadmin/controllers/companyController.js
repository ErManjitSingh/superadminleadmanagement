const Company = require('../models/Company');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const PlatformAuditLog = require('../models/PlatformAuditLog');
const CompanyLoginLog = require('../models/CompanyLoginLog');
const User = require('../../models/User');
const ApiError = require('../../utils/apiError');
const asyncHandler = require('../../utils/asyncHandler');
const { parsePagination, paginatedResponse } = require('../../utils/pagination');
const { provisionCompany, getCompanyCounts, generateTempPassword } = require('../services/companyProvisioningService');
const { logPlatformAudit } = require('../services/platformAuditService');
const { generateToken, formatUserResponse } = require('../../middleware/auth');
const { resolveUserPermissions } = require('../../services/permissionsService');

function sanitizeCompany(doc, counts = {}) {
  const c = doc.toObject ? doc.toObject() : doc;
  return {
    id: c._id,
    name: c.name,
    slug: c.slug,
    subdomain: c.subdomain,
    primaryDomain: c.primaryDomain,
    domainType: c.domainType,
    domainVerified: c.domainVerified,
    businessType: c.businessType,
    billingCycle: c.billingCycle,
    autoRenewal: c.autoRenewal,
    logo: c.logo,
    ownerName: c.ownerName,
    ownerEmail: c.ownerEmail,
    phone: c.phone,
    country: c.country,
    state: c.state,
    city: c.city,
    address: c.address,
    gst: c.gst,
    timezone: c.timezone,
    currency: c.currency,
    subscriptionPlan: c.subscriptionPlanId,
    status: c.status,
    storageLimitGb: c.storageLimitGb,
    storageUsedMb: c.storageUsedMb,
    trialEndDate: c.trialEndDate,
    renewDate: c.renewDate,
    features: c.features,
    isLegacy: c.isLegacy,
    adminUserId: c.adminUserId,
    usersCount: counts.usersCount ?? 0,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

function buildCompanyFilter(query) {
  const filter = { deletedAt: null };
  if (query.status) filter.status = query.status;
  if (query.search) {
    const s = query.search.trim();
    filter.$or = [
      { name: { $regex: s, $options: 'i' } },
      { slug: { $regex: s, $options: 'i' } },
      { ownerEmail: { $regex: s, $options: 'i' } },
      { ownerName: { $regex: s, $options: 'i' } },
    ];
  }
  if (query.plan) filter.subscriptionPlanId = query.plan;
  return filter;
}

const listCompanies = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 20 });
  const filter = buildCompanyFilter(req.query);
  const sortField = ['name', 'createdAt', 'status', 'renewDate'].includes(req.query.sortBy)
    ? req.query.sortBy
    : 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

  const [companies, total] = await Promise.all([
    Company.find(filter)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit)
      .populate('subscriptionPlanId', 'name slug monthlyPrice yearlyPrice')
      .lean(),
    Company.countDocuments(filter),
  ]);

  const enriched = await Promise.all(
    companies.map(async (c) => {
      const counts = await getCompanyCounts(c._id);
      return sanitizeCompany(c, counts);
    })
  );

  res.json(paginatedResponse(enriched, { page, limit, total }));
});

const getCompany = asyncHandler(async (req, res) => {
  const company = await Company.findOne({ _id: req.params.id, deletedAt: null })
    .populate('subscriptionPlanId')
    .lean();
  if (!company) throw new ApiError(404, 'Company not found');

  const counts = await getCompanyCounts(company._id);
  const loginLogs = await CompanyLoginLog.find({ companyId: company._id })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  const auditLogs = await PlatformAuditLog.find({ companyId: company._id })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const adminUser = company.adminUserId
    ? await User.findById(company.adminUserId).select('name email lastLogin').lean()
    : null;

  res.json({
    company: sanitizeCompany(company, counts),
    adminUser,
    loginLogs,
    auditLogs,
  });
});

const createCompany = asyncHandler(async (req, res) => {
  const result = await provisionCompany({
    payload: req.body,
    superAdminId: req.superAdmin._id,
  });

  await logPlatformAudit({
    actor: req.superAdmin,
    action: 'create',
    resourceType: 'company',
    resourceId: result.company._id,
    companyId: result.company._id,
    metadata: { name: result.company.name, slug: result.company.slug },
    req,
  });

  const counts = await getCompanyCounts(result.company._id);
  res.status(201).json({
    company: sanitizeCompany(result.company, counts),
    provisioning: {
      adminUserId: result.adminUser.id,
      tempPassword: result.tempPassword,
    },
  });
});

const updateCompany = asyncHandler(async (req, res) => {
  const company = await Company.findOne({ _id: req.params.id, deletedAt: null });
  if (!company) throw new ApiError(404, 'Company not found');

  const allowed = [
    'name', 'logo', 'primaryDomain', 'ownerName', 'ownerEmail', 'phone',
    'country', 'state', 'city', 'address', 'gst', 'timezone', 'currency',
    'subscriptionPlanId', 'status', 'storageLimitGb', 'trialEndDate', 'renewDate', 'features',
  ];

  for (const key of allowed) {
    if (req.body[key] !== undefined) company[key] = req.body[key];
  }
  company.updatedBy = req.superAdmin._id;
  await company.save();

  await logPlatformAudit({
    actor: req.superAdmin,
    action: 'update',
    resourceType: 'company',
    resourceId: company._id,
    companyId: company._id,
    metadata: { fields: Object.keys(req.body) },
    req,
  });

  const counts = await getCompanyCounts(company._id);
  res.json({ company: sanitizeCompany(company, counts) });
});

const deleteCompany = asyncHandler(async (req, res) => {
  const company = await Company.findOne({ _id: req.params.id, deletedAt: null });
  if (!company) throw new ApiError(404, 'Company not found');
  if (company.isLegacy) throw new ApiError(400, 'Cannot delete legacy tenant');

  company.deletedAt = new Date();
  company.status = 'inactive';
  company.updatedBy = req.superAdmin._id;
  await company.save();

  await logPlatformAudit({
    actor: req.superAdmin,
    action: 'delete',
    resourceType: 'company',
    resourceId: company._id,
    companyId: company._id,
    req,
  });

  res.json({ message: 'Company deleted' });
});

const bulkAction = asyncHandler(async (req, res) => {
  const { ids, action, trialDays } = req.body;
  if (!Array.isArray(ids) || !ids.length) throw new ApiError(400, 'Company IDs required');

  const companies = await Company.find({ _id: { $in: ids }, deletedAt: null, isLegacy: { $ne: true } });
  const updates = [];

  for (const company of companies) {
    switch (action) {
      case 'activate':
        company.status = 'active';
        break;
      case 'suspend':
        company.status = 'suspended';
        break;
      case 'extend_trial': {
        const days = trialDays || 14;
        const base = company.trialEndDate && company.trialEndDate > new Date() ? company.trialEndDate : new Date();
        company.trialEndDate = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
        company.status = 'trial';
        break;
      }
      case 'renew': {
        company.renewDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        company.status = 'active';
        break;
      }
      default:
        throw new ApiError(400, 'Invalid bulk action');
    }
    company.updatedBy = req.superAdmin._id;
    await company.save();
    updates.push(company._id);
  }

  await logPlatformAudit({
    actor: req.superAdmin,
    action: `bulk_${action}`,
    resourceType: 'company',
    metadata: { ids: updates },
    req,
  });

  res.json({ updated: updates.length });
});

const impersonateCompany = asyncHandler(async (req, res) => {
  const company = await Company.findOne({ _id: req.params.id, deletedAt: null });
  if (!company) throw new ApiError(404, 'Company not found');
  if (!company.adminUserId) throw new ApiError(400, 'Company has no admin user');

  const user = await User.findById(company.adminUserId);
  if (!user || user.status === 'disabled') throw new ApiError(400, 'Company admin unavailable');

  const permissions = await resolveUserPermissions(user);
  const token = generateToken(user._id, user.role);

  await CompanyLoginLog.create({
    companyId: company._id,
    userId: user._id,
    userEmail: user.email,
    loginType: 'impersonation',
    impersonatedBy: req.superAdmin._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  await logPlatformAudit({
    actor: req.superAdmin,
    action: 'impersonate',
    resourceType: 'company',
    resourceId: company._id,
    companyId: company._id,
    metadata: { adminEmail: user.email },
    req,
  });

  const crmBaseUrl = process.env.CRM_FRONTEND_URL || 'http://localhost:5173';

  res.json({
    token,
    impersonation: true,
    user: formatUserResponse(user, permissions),
    redirectUrl: `${crmBaseUrl}/auth/impersonate`,
    company: { id: company._id, name: company.name, slug: company.slug },
  });
});

const exportCompanies = asyncHandler(async (req, res) => {
  const filter = buildCompanyFilter(req.query);
  const companies = await Company.find(filter)
    .populate('subscriptionPlanId', 'name slug')
    .sort({ createdAt: -1 })
    .lean();

  const rows = await Promise.all(
    companies.map(async (c) => {
      const counts = await getCompanyCounts(c._id);
      return {
        name: c.name,
        slug: c.slug,
        subdomain: c.subdomain,
        ownerName: c.ownerName,
        ownerEmail: c.ownerEmail,
        status: c.status,
        plan: c.subscriptionPlanId?.name || '',
        usersCount: counts.usersCount,
        createdAt: c.createdAt,
        renewDate: c.renewDate,
      };
    })
  );

  res.json({ data: rows });
});

const getCompanyUsers = asyncHandler(async (req, res) => {
  const company = await Company.findOne({ _id: req.params.id, deletedAt: null });
  if (!company) throw new ApiError(404, 'Company not found');

  const users = await User.find({ companyId: company._id })
    .select('name email role status lastLogin createdAt department')
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    data: users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      department: u.department,
      lastLogin: u.lastLogin,
      createdAt: u.createdAt,
    })),
  });
});

const resetAdminPassword = asyncHandler(async (req, res) => {
  const company = await Company.findOne({ _id: req.params.id, deletedAt: null });
  if (!company) throw new ApiError(404, 'Company not found');
  if (!company.adminUserId) throw new ApiError(400, 'No admin user');

  const user = await User.findById(company.adminUserId);
  if (!user) throw new ApiError(404, 'Admin user not found');

  const tempPassword = req.body.password || generateTempPassword();
  user.password = tempPassword;
  await user.save();

  await logPlatformAudit({
    actor: req.superAdmin,
    action: 'password_reset',
    resourceType: 'company',
    resourceId: company._id,
    companyId: company._id,
    metadata: { adminEmail: user.email },
    req,
  });

  res.json({ message: 'Password reset successfully', tempPassword });
});

const upgradePlan = asyncHandler(async (req, res) => {
  const company = await Company.findOne({ _id: req.params.id, deletedAt: null });
  if (!company) throw new ApiError(404, 'Company not found');

  const plan = await SubscriptionPlan.findOne({ _id: req.body.planId, deletedAt: null });
  if (!plan) throw new ApiError(400, 'Invalid plan');

  company.subscriptionPlanId = plan._id;
  company.storageLimitGb = plan.storageLimitGb;
  if (req.body.billingCycle) company.billingCycle = req.body.billingCycle;
  company.updatedBy = req.superAdmin._id;
  await company.save();

  await logPlatformAudit({
    actor: req.superAdmin,
    action: 'plan_changed',
    resourceType: 'company',
    resourceId: company._id,
    companyId: company._id,
    metadata: { planSlug: plan.slug, planName: plan.name },
    req,
  });

  const counts = await getCompanyCounts(company._id);
  res.json({ company: sanitizeCompany(company, counts) });
});

module.exports = {
  listCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
  bulkAction,
  impersonateCompany,
  exportCompanies,
  getCompanyUsers,
  resetAdminPassword,
  upgradePlan,
};
