const ApiError = require('./apiError');
const { withCompany, normalizeCompanyId } = require('./branchScope');

function tenantFilter(filter = {}, req) {
  return withCompany(filter, req?.companyId || null);
}

function companyScopedIdFilter(id, req) {
  const filter = { _id: id };
  if (req?.companyId) {
    filter.companyId = normalizeCompanyId(req.companyId);
  }
  return filter;
}

function assertTenantDocument(doc, req, label = 'Resource') {
  if (!doc) throw new ApiError(404, `${label} not found`);
  if (req?.companyId && doc.companyId && String(doc.companyId) !== String(req.companyId)) {
    throw new ApiError(404, `${label} not found`);
  }
  return doc;
}

module.exports = {
  tenantFilter,
  companyScopedIdFilter,
  assertTenantDocument,
};
