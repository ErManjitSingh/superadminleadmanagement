/** Who can drag a lead card on the Kanban board */
export function canDragLeadInKanban(lead, user) {
  if (!lead || !user) return false;
  const role = user.role;
  const userId = String(user._id || user.id || '');

  if (role === 'admin' || role === 'sales_manager') return true;

  const assigneeId = String(lead.assignedTo?._id || lead.assignedTo || '');
  const teamLeaderId = String(lead.assignedTeamLeader?._id || lead.assignedTeamLeader || '');

  if (role === 'sales_executive') {
    return Boolean(assigneeId && assigneeId === userId);
  }

  if (role === 'team_leader') {
    return !assigneeId || assigneeId === userId || teamLeaderId === userId;
  }

  return false;
}
