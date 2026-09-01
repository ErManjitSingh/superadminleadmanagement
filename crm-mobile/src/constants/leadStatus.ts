export const LEAD_STATUS_LABELS: Record<string, string> = {
  new: 'New Lead',
  contacted: 'Contacted',
  working_progress: 'Working Progress',
  follow_up: 'Follow Up',
  quotation_sent: 'Quotation Sent',
  negotiation: 'Negotiation',
  reactivated: 'Reactivated',
  converted: 'Converted',
  lost: 'Lost',
  booked_from_another_company: 'Booked Elsewhere',
};

export const LEAD_STATUS_COLORS: Record<string, string> = {
  new: '#3B82F6',
  contacted: '#8B5CF6',
  working_progress: '#6366F1',
  follow_up: '#F59E0B',
  quotation_sent: '#0EA5E9',
  negotiation: '#EC4899',
  reactivated: '#14B8A6',
  converted: '#10B981',
  lost: '#94A3B8',
  booked_from_another_company: '#64748B',
};

export const LEAD_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'follow-up', label: 'Follow-up' },
  { key: 'hot', label: 'Hot' },
  { key: 'converted', label: 'Converted' },
  { key: 'lost', label: 'Lost' },
] as const;

export function getLeadStatusLabel(status?: string): string {
  if (!status) return '—';
  return LEAD_STATUS_LABELS[status] || status.replace(/_/g, ' ');
}

export function getLeadStatusColor(status?: string): string {
  if (!status) return '#94A3B8';
  return LEAD_STATUS_COLORS[status] || '#64748B';
}
