/** Only sales executives may create or edit follow-ups. All other roles are read-only. */
export function canManageFollowUps(user) {
  return user?.role === 'sales_executive';
}
