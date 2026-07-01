import { getPermissionsForRole } from './rolePermissions';

function resolvePermissions(user) {
  let perms;
  if (user?.permissions) perms = user.permissions;
  else if (user?.role) perms = getPermissionsForRole(user.role);
  else return null;

  if (user?.role === 'admin') {
    perms = {
      ...perms,
      quotations: {
        ...perms.quotations,
        view: true,
        create: true,
        edit: true,
        delete: true,
        approve: true,
      },
    };
  }
  return perms;
}

export function canAccess(user, module, action = 'view') {
  if (!module) return true;
  const perms = resolvePermissions(user);
  if (!perms) return false;
  return !!perms[module]?.[action];
}
function filterSectionItems(items, user) {
  return items.filter((child) => {
    if (child.roles?.length && !child.roles.includes(user?.role)) return false;
    if (child.permission && !canAccess(user, child.permission.module, child.permission.action)) return false;
    return true;
  });
}

export function filterNavItems(items, user) {
  return items.reduce((acc, item) => {
    if (item.sections) {
      const sections = item.sections
        .map((section) => ({
          ...section,
          items: filterSectionItems(section.items, user),
        }))
        .filter((section) => section.items.length);
      if (!sections.length) return acc;
      acc.push({ ...item, sections });
      return acc;
    }

    if (item.children) {
      const children = filterSectionItems(item.children, user);
      if (!children.length) return acc;
      acc.push({ ...item, children });
      return acc;
    }
    if (item.roles?.length && !item.roles.includes(user?.role)) return acc;
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
