const Role = require('../models/Role');
const { getPermissionsForRole } = require('../config/permissions');

async function resolveUserPermissions(user) {
  if (!user) return getPermissionsForRole(null);
  if (user.roleId) {
    const role = await Role.findById(user.roleId).select('permissions').lean();
    if (role?.permissions) return role.permissions;
  }
  return getPermissionsForRole(user.role);
}

module.exports = { resolveUserPermissions };
