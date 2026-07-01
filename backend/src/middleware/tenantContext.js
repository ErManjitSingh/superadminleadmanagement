const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { runWithTenantContext } = require('../utils/tenantContextStore');
const { resolveCompanyFromRequest, assertCompanyAccessible } = require('../services/tenantResolveService');

const resolveTenant = asyncHandler(async (req, res, next) => {
  const company = await resolveCompanyFromRequest(req);
  if (company) {
    req.resolvedCompany = company;
    req.resolvedCompanyId = company._id;
  }
  next();
});

const EMAIL_VERIFICATION_EXEMPT = [
  '/api/auth/me',
  '/api/auth/logout',
  '/api/auth/login',
  '/api/company-settings',
  '/api/public',
];

function isEmailVerificationExempt(url) {
  return EMAIL_VERIFICATION_EXEMPT.some((p) => url.startsWith(p));
}

const attachTenantContext = asyncHandler(async (req, res, next) => {
  const companyId = req.user?.companyId || null;

  if (!companyId) {
    throw new ApiError(403, 'User is not assigned to a company. Contact platform support.');
  }

  if (req.resolvedCompanyId && String(req.resolvedCompanyId) !== String(companyId)) {
    throw new ApiError(403, 'Access denied for this tenant');
  }

  const company = req.resolvedCompany || req.tenantCompany;
  if (company) {
    const check = assertCompanyAccessible(company);
    if (!check.ok) throw new ApiError(check.code, check.message);
    req.tenantCompany = company;
  } else {
    const Company = require('../superadmin/models/Company');
    const loaded = await Company.findOne({ _id: companyId, deletedAt: null }).lean();
    const check = assertCompanyAccessible(loaded);
    if (!check.ok) throw new ApiError(check.code, check.message);
    req.tenantCompany = loaded;
  }

  const url = req.originalUrl || '';
  if (
    req.tenantCompany
    && !req.tenantCompany.isLegacy
    && !req.tenantCompany.ownerEmailVerified
    && !isEmailVerificationExempt(url)
  ) {
    throw new ApiError(403, 'Please verify your business email to continue. Check your inbox or resend from settings.');
  }

  req.companyId = companyId;
  req.branchId = null;

  runWithTenantContext(
    {
      companyId,
      branchId: null,
      userId: req.user?._id || null,
    },
    () => next()
  );
});

module.exports = { resolveTenant, attachTenantContext };
