export const LEAD_STATUSES = [
  { value: 'new', label: 'New Lead' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'working_progress', label: 'Working Progress' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'quotation_sent', label: 'Quotation Sent' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'reactivated', label: 'Reactivated' },
  { value: 'converted', label: 'Converted' },
  { value: 'lost', label: 'Lost' },
  { value: 'booked_from_another_company', label: 'Booked From Another Company' },
];

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
  '/leads/inbox/new': {
    title: 'New Leads',
    subtitle: 'Fresh inquiries awaiting first contact',
    status: 'new',
    assignee: '',
  },
  '/leads/new-leads': { title: "Today's Leads", subtitle: 'Inquiries received today', status: '', assignee: '', todayOnly: true },
  '/leads/hot': {
    title: 'Hot Leads',
    subtitle: 'High-priority leads requiring immediate attention',
    status: '',
    assignee: '',
    listFilter: 'hot',
  },
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
