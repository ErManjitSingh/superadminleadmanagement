/** Executives manage assigned work; admins may manage any lead in their company. */
export function canManageFollowUps(user) {
  return ['sales_executive', 'admin'].includes(user?.role);
}
