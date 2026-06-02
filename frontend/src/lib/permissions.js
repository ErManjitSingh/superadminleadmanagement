import { getPermissionsForRole } from './rolePermissions';

function resolvePermissions(user) {
  if (user?.permissions) return user.permissions;
  if (user?.role) return getPermissionsForRole(user.role);
  return null;
}

export function canAccess(user, module, action = 'view') {
  if (!module) return true;
  const perms = resolvePermissions(user);
  if (!perms) return false;
  return !!perms[module]?.[action];
}
function matchesRole(item, user) {
  if (!item.roles?.length) return true;
  return item.roles.includes(user?.role);
}

export function filterNavItems(items, user) {
  return items.reduce((acc, item) => {
    if (item.children) {
      const children = item.children.filter((child) => {
        if (!matchesRole(child, user)) return false;
        if (child.permission && !canAccess(user, child.permission.module, child.permission.action)) return false;
        return true;
      });
      if (!children.length) return acc;
      acc.push({ ...item, children });
      return acc;
    }
    if (!matchesRole(item, user)) return acc;
    if (item.permission && !canAccess(user, item.permission.module, item.permission.action)) return acc;
    acc.push(item);
    return acc;
  }, []);
}

export const ROUTE_PERMISSIONS = {
  leads: { module: 'leads', action: 'view' },
  'leads/new': { module: 'leads', action: 'create' },
  followups: { module: 'leads', action: 'view' },
  whatsapp: { module: 'leads', action: 'view' },
  customers: { module: 'customers', action: 'view' },
  quotations: { module: 'quotations', action: 'view' },
  packages: { module: 'packages', action: 'view' },
  team: { module: 'users', action: 'view' },
  reports: { module: 'reports', action: 'view' },
};
