export const AUTH_STORAGE_KEYS = {
  USER: 'user',
  ROLE: 'role',
  IS_AUTHENTICATED: 'isAuthenticated',
};

/** @typedef {'admin'|'sales_manager'|'sales_executive'|'team_leader'|'accountant'|'operations_manager'} RoleSlug */

export const VALID_ROLES = /** @type {RoleSlug[]} */ ([
  'admin',
  'sales_manager',
  'sales_executive',
  'team_leader',
  'accountant',
  'operations_manager',
]);

/** @type {Record<RoleSlug, string>} */
export const ROLE_DASHBOARD_PATHS = {
  admin: '/admin/dashboard',
  sales_manager: '/sales-manager/dashboard',
  sales_executive: '/sales-executive/dashboard',
  team_leader: '/team-leader/dashboard',
  accountant: '/accountant/dashboard',
  operations_manager: '/operations-manager/dashboard',
};

export const ROLE_LABELS = {
  admin: 'Admin',
  sales_manager: 'Sales Manager',
  sales_executive: 'Sales Executive',
  team_leader: 'Team Leader',
  accountant: 'Accountant',
  operations_manager: 'Operations Manager',
};
