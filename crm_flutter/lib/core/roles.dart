const roleLabels = {
  'admin': 'Admin',
  'sales_manager': 'Sales Manager',
  'sales_executive': 'Sales Executive',
  'team_leader': 'Team Leader',
  'accountant': 'Accountant',
  'operations_manager': 'Operations Manager',
};

const mobileSupportedRoles = {
  'admin',
  'sales_manager',
  'sales_executive',
  'team_leader',
  'operations_manager',
};

String getRoleApiPrefix(String role) {
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

bool isMobileRoleSupported(String? role) =>
    role != null && mobileSupportedRoles.contains(role);

const leadStatusLabels = {
  'new': 'New Lead',
  'contacted': 'Contacted',
  'working_progress': 'Working Progress',
  'follow_up': 'Follow Up',
  'quotation_sent': 'Quotation Sent',
  'negotiation': 'Negotiation',
  'reactivated': 'Reactivated',
  'converted': 'Converted',
  'lost': 'Lost',
  'booked_from_another_company': 'Booked Elsewhere',
};

const leadStatusColors = {
  'new': 0xFF3B82F6,
  'contacted': 0xFF8B5CF6,
  'working_progress': 0xFF6366F1,
  'follow_up': 0xFFF59E0B,
  'quotation_sent': 0xFF0EA5E9,
  'negotiation': 0xFFEC4899,
  'reactivated': 0xFF14B8A6,
  'converted': 0xFF10B981,
  'lost': 0xFF94A3B8,
  'booked_from_another_company': 0xFF64748B,
};

String leadStatusLabel(String? status) {
  if (status == null || status.isEmpty) return '—';
  return leadStatusLabels[status] ?? status.replaceAll('_', ' ');
}

int leadStatusColor(String? status) =>
    leadStatusColors[status] ?? 0xFF64748B;
