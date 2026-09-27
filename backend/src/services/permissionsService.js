const Role = require('../models/Role');
const { getPermissionsForRole } = require('../config/permissions');

function mergePermissions(stored, defaults) {
  const merged = { ...defaults };
  for (const key of Object.keys(defaults)) {
    merged[key] = { ...defaults[key], ...(stored?.[key] || {}) };
  }
  return merged;
}

async function resolveUserPermissions(user) {
  const defaults = getPermissionsForRole(user?.role);
  if (!user) return defaults;
  let perms = defaults;
  if (user.roleId) {
    const roleQuery = { _id: user.roleId };
    if (user.companyId) roleQuery.companyId = user.companyId;
    const role = await Role.findOne(roleQuery).select('permissions').lean();
    if (role?.permissions) perms = mergePermissions(role.permissions, defaults);
  }
  if (user.role === 'admin') {
    perms.leads = {
      ...perms.leads,
      view: true,
      create: true,
      edit: true,
      delete: true,
      assign: true,
    };
    perms.quotations = {
      ...perms.quotations,
      view: true,
      create: true,
      edit: true,
      delete: true,
      approve: true,
    };
  }
  // Sales manager: full lead/quote + operations access; never delete leads (even if Role doc is stale)
  if (user.role === 'sales_manager') {
    const sm = getPermissionsForRole('sales_manager');
    perms.leads = { ...perms.leads, ...sm.leads, delete: false };
    perms.quotations = { ...perms.quotations, ...sm.quotations, delete: false };
    perms.operations = { ...sm.operations };
    perms.payments = { ...perms.payments, ...sm.payments };
  }
  return perms;
}

module.exports = { resolveUserPermissions };
