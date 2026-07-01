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
  if (user.roleId) {
    const roleQuery = { _id: user.roleId };
    if (user.companyId) roleQuery.companyId = user.companyId;
    const role = await Role.findOne(roleQuery).select('permissions').lean();
    if (role?.permissions) return mergePermissions(role.permissions, defaults);
  }
  return defaults;
}

module.exports = { resolveUserPermissions };
