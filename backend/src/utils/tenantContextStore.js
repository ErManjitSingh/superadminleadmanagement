const { AsyncLocalStorage } = require('async_hooks');

const tenantStore = new AsyncLocalStorage();

function runWithTenantContext(context, fn) {
  return tenantStore.run(context, fn);
}

function getTenantContext() {
  return tenantStore.getStore() || {};
}

function getCompanyId() {
  return getTenantContext().companyId || null;
}

function getBranchId() {
  return getTenantContext().branchId || null;
}

module.exports = {
  tenantStore,
  runWithTenantContext,
  getTenantContext,
  getCompanyId,
  getBranchId,
};
