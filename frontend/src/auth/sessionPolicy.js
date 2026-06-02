export const RESTRICTED_SESSION_ROLES = ['admin', 'sales_manager'];
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

export function requiresRestrictedSession(role) {
  return RESTRICTED_SESSION_ROLES.includes(role);
}
