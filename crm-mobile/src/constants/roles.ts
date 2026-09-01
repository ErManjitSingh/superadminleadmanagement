import type { UserRole } from '@/src/types';

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  sales_manager: 'Sales Manager',
  sales_executive: 'Sales Executive',
  team_leader: 'Team Leader',
  accountant: 'Accountant',
  operations_manager: 'Operations Manager',
};

export const MOBILE_SUPPORTED_ROLES: UserRole[] = [
  'admin',
  'sales_manager',
  'sales_executive',
  'team_leader',
];

export function getRoleApiPrefix(role: UserRole): string {
  switch (role) {
    case 'sales_executive':
      return '/sales-executive';
    case 'sales_manager':
      return '/sales-manager';
    case 'team_leader':
      return '/team-leader';
    case 'admin':
      return '';
    default:
      return '/sales-executive';
  }
}

export function isMobileRoleSupported(role: UserRole): boolean {
  return MOBILE_SUPPORTED_ROLES.includes(role);
}
