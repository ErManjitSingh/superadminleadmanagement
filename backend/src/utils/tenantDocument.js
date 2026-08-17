const ApiError = require('./apiError');
const { withCompany, normalizeCompanyId } = require('./branchScope');

function requireCompanyId(req) {
  if (!req?.companyId) {
    throw new ApiError(403, 'Tenant context required');
  }
  return normalizeCompanyId(req.companyId);
}

function tenantFilter(filter = {}, req) {
  const companyId = requireCompanyId(req);
  return withCompany(filter, companyId);
}

function companyScopedIdFilter(id, req) {
  return {
    _id: id,
    companyId: requireCompanyId(req),
  };
}

function assertTenantDocument(doc, req, label = 'Resource') {
  if (!doc) throw new ApiError(404, `${label} not found`);
  if (req?.companyId && String(doc.companyId || '') !== String(req.companyId)) {
    throw new ApiError(404, `${label} not found`);
  }
  return doc;
}

module.exports = {
  tenantFilter,
  companyScopedIdFilter,
  assertTenantDocument,
  requireCompanyId,
};
