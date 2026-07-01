const mongoose = require('mongoose');
const { getCompanyId } = require('./tenantContextStore');

function normalizeCompanyId(companyId) {
  if (!companyId) return null;
  if (companyId instanceof mongoose.Types.ObjectId) return companyId;
  const raw = String(companyId).trim();
  if (!raw || !mongoose.Types.ObjectId.isValid(raw)) return companyId;
  return new mongoose.Types.ObjectId(raw);
}

/** Company-only tenant scope. Branch filtering is disabled platform-wide. */
function withCompany(filter = {}, companyId = null) {
  const effectiveCompanyId = companyId || getCompanyId();
  if (!effectiveCompanyId) return { ...filter };
  return { ...filter, companyId: normalizeCompanyId(effectiveCompanyId) };
}

/** @deprecated Branch scoping removed — applies company filter only. */
function withBranch(filter = {}, _branchId = null) {
  return withCompany(filter);
}

function withTenantScope(filter = {}, { companyId } = {}) {
  return withCompany(filter, companyId);
}

module.exports = {
  withBranch,
  withCompany,
  withTenantScope,
  normalizeCompanyId,
};
