export const LEAD_STATUSES = [
  { value: 'new', label: 'New Lead', kanban: true },
  { value: 'contacted', label: 'Contacted', kanban: true },
  { value: 'working_progress', label: 'Working Progress', kanban: true },
  { value: 'follow_up', label: 'Follow Up', kanban: true },
  { value: 'quotation_sent', label: 'Quotation Sent', kanban: true },
  { value: 'negotiation', label: 'Negotiation', kanban: true },
  { value: 'reactivated', label: 'Reactivated', kanban: true },
  { value: 'converted', label: 'Converted', kanban: true },
  { value: 'lost', label: 'Lost', kanban: false },
  { value: 'booked_from_another_company', label: 'Booked From Another Company', kanban: false },
];

export const KANBAN_COLUMNS = LEAD_STATUSES.filter((s) => s.kanban);

/** Stored source keys — display uses short labels via getLeadSourceShortLabel */
export const LEAD_SOURCES = [
  'google_ads',
  'facebook_ads',
  'website',
  'whatsapp',
  'referral',
  'walk-in',
  'phone',
  'social',
  'organic',
];

export const AGENTS = [
  { id: 'agent-1', name: 'Priya Patel' },
  { id: 'agent-2', name: 'Amit Kumar' },
  { id: 'agent-3', name: 'Vikram Singh' },
];

export const DESTINATIONS = [
  'Goa', 'Kerala', 'Dubai', 'Thailand', 'Manali', 'Maldives', 'Singapore', 'Europe',
];

export const TRAVEL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const pageConfig = {
  '/leads': { title: 'Lead Management', subtitle: 'All travel inquiries', status: '', assignee: '' },
  '/leads/new-leads': { title: 'New Leads', subtitle: 'Awaiting first contact', status: 'new', assignee: '' },
  '/leads/unassigned': {
    title: 'Unassigned Leads',
    subtitle: 'Not yet assigned to any executive',
    status: '',
    assignee: 'unassigned',
  },
  '/leads/assigned': { title: 'Assigned Leads', subtitle: 'Leads assigned to team members', status: '', assignee: 'assigned' },
  '/leads/converted': { title: 'Converted Leads', subtitle: 'Successfully closed deals', status: 'converted', assignee: '' },
  '/leads/lost': { title: 'Lost Leads', subtitle: 'Did not convert', status: 'lost', assignee: '' },
};

export function formatLeadId(id) {
  return `LD-${String(id).replace(/\D/g, '').slice(-4).padStart(4, '0')}`;
}

export const emptyFilters = {
  search: '',
  destination: '',
  source: '',
  agent: '',
  status: '',
  travelMonth: '',
  budgetMin: '',
  budgetMax: '',
  dateFrom: '',
  dateTo: '',
};
