import type { UserRole } from '@/src/types';

export const CRM_WEB_ORIGIN =
  process.env.EXPO_PUBLIC_CRM_WEB_URL || 'https://crm.exploremybharat.info/app';

/** Ensure production CRM URLs include the /app Vite basename. */
export function resolveCrmWebOrigin() {
  const raw = (CRM_WEB_ORIGIN || '').replace(/\/$/, '');
  if (!raw) return 'https://crm.exploremybharat.info/app';
  if (/\/app$/i.test(raw)) return raw;
  if (/exploremybharat\.info$/i.test(raw) || /indiaholidaydestination\.com$/i.test(raw)) {
    return `${raw}/app`;
  }
  return raw;
}

export type MenuItem = {
  id: string;
  label: string;
  icon: string;
  /** Native route inside the app */
  native?: string;
  /** Path on CRM website (opened in authenticated WebView) */
  webPath?: string;
  children?: MenuItem[];
};

const executiveMenu: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'home', native: '/(tabs)' },
  {
    id: 'my-leads',
    label: 'My Leads',
    icon: 'people',
    children: [
      { id: 'leads-new', label: 'New Leads', icon: 'sparkles', native: '/(tabs)/leads?filter=new' },
      { id: 'leads-all', label: 'All Leads', icon: 'list', native: '/(tabs)/leads?filter=all' },
      { id: 'leads-contacted', label: 'Contacted Leads', icon: 'call', native: '/(tabs)/leads?filter=contacted' },
      { id: 'leads-follow', label: 'Follow-up Leads', icon: 'calendar', native: '/(tabs)/leads?filter=follow-up' },
      { id: 'leads-hot', label: 'Hot Leads', icon: 'flame', native: '/(tabs)/leads?filter=hot' },
      { id: 'leads-reactivated', label: 'Reactivated Leads', icon: 'refresh', webPath: '/sales-executive/leads/reactivated' },
      { id: 'leads-converted', label: 'Converted Leads', icon: 'trophy', native: '/(tabs)/leads?filter=converted' },
      { id: 'leads-lost', label: 'Lost Leads', icon: 'close-circle', native: '/(tabs)/leads?filter=lost' },
    ],
  },
  { id: 'quotations', label: 'Quotations', icon: 'document-text', native: '/(tabs)/quotes' },
  {
    id: 'quote-new',
    label: 'Create Quotation',
    icon: 'add-circle',
    native: '/quotation/builder',
  },
  { id: 'followups', label: 'Follow-ups', icon: 'calendar', native: '/(tabs)/followups' },
  { id: 'customers', label: 'Customers', icon: 'person-circle', webPath: '/sales-executive/customers' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar-outline', webPath: '/sales-executive/calendar' },
  { id: 'email', label: 'Email Activity', icon: 'mail', webPath: '/sales-executive/email-activity' },
  { id: 'notifications', label: 'Notifications', icon: 'notifications', native: '/notifications' },
  { id: 'profile', label: 'Profile', icon: 'person', native: '/(tabs)/profile' },
];

const managerMenu: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'home', native: '/(tabs)' },
  {
    id: 'lead-mgmt',
    label: 'Lead Management',
    icon: 'people',
    children: [
      { id: 'leads-all', label: 'All Team Leads', icon: 'people', native: '/(tabs)/leads?filter=all' },
      { id: 'leads-unassigned', label: 'Unassigned Leads', icon: 'file-tray-outline', webPath: '/sales-manager/leads/unassigned' },
      { id: 'leads-assigned', label: 'Assigned Leads', icon: 'checkmark-done', webPath: '/sales-manager/leads/assigned' },
      { id: 'leads-hot', label: 'Hot Leads', icon: 'flame', native: '/(tabs)/leads?filter=hot' },
      { id: 'leads-lost', label: 'Lost Leads', icon: 'close-circle', native: '/(tabs)/leads?filter=lost' },
      { id: 'leads-reactivated', label: 'Reactivated Leads', icon: 'refresh', webPath: '/sales-manager/reactivated-leads' },
    ],
  },
  { id: 'email', label: 'Email Activity', icon: 'mail', webPath: '/sales-manager/email-activity' },
  { id: 'assignment', label: 'Lead Assignment', icon: 'person-add', webPath: '/sales-manager/assignment' },
  { id: 'dest-assign', label: 'Destination Assignment', icon: 'location', webPath: '/sales-manager/destination-assignment' },
  { id: 'skill-assign', label: 'Skill Assignment', icon: 'ribbon', webPath: '/sales-manager/skill-assignment' },
  { id: 'teams', label: 'Team Management', icon: 'people-circle', webPath: '/sales-manager/teams' },
  { id: 'followups', label: 'Follow-up Monitoring', icon: 'calendar', native: '/(tabs)/followups' },
  { id: 'performance', label: 'Team Performance', icon: 'trophy', webPath: '/sales-manager/team' },
  {
    id: 'quotations',
    label: 'Quotations',
    icon: 'document-text',
    children: [
      { id: 'q-pending', label: 'Pending Approval', icon: 'time', webPath: '/sales-manager/quotations/pending' },
      { id: 'q-approved', label: 'Approved Quotes', icon: 'checkmark-circle', webPath: '/sales-manager/quotations/approved' },
      { id: 'q-rejected', label: 'Rejected Quotes', icon: 'close-circle', webPath: '/sales-manager/quotations/rejected' },
      { id: 'q-native', label: 'All Quotes (App)', icon: 'list', native: '/(tabs)/quotes' },
      { id: 'q-new', label: 'Create Quotation', icon: 'add-circle', native: '/quotation/builder' },
    ],
  },
  { id: 'reports', label: 'Reports', icon: 'bar-chart', webPath: '/sales-manager/reports' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar-outline', webPath: '/sales-manager/calendar' },
  { id: 'notifications', label: 'Notifications', icon: 'notifications', native: '/notifications' },
  { id: 'profile', label: 'Profile', icon: 'person', native: '/(tabs)/profile' },
];

const leaderMenu: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'home', native: '/(tabs)' },
  {
    id: 'lead-mgmt',
    label: 'Lead Management',
    icon: 'people',
    children: [
      { id: 'leads-all', label: 'Team Leads', icon: 'people', native: '/(tabs)/leads?filter=all' },
      { id: 'leads-lost', label: 'Lost Leads', icon: 'close-circle', native: '/(tabs)/leads?filter=lost' },
      { id: 'leads-reactivated', label: 'Reactivated Leads', icon: 'refresh', webPath: '/team-leader/reactivated-leads' },
    ],
  },
  { id: 'email', label: 'Email Activity', icon: 'mail', webPath: '/team-leader/email-activity' },
  { id: 'followups', label: 'Team Follow-ups', icon: 'calendar', native: '/(tabs)/followups' },
  { id: 'performance', label: 'Executive Performance', icon: 'trophy', webPath: '/team-leader/performance' },
  { id: 'escalations', label: 'Lead Escalations', icon: 'warning', webPath: '/team-leader/escalations' },
  {
    id: 'quotations',
    label: 'Quotations',
    icon: 'document-text',
    children: [
      { id: 'q-pending', label: 'Pending', icon: 'time', webPath: '/team-leader/quotations/pending' },
      { id: 'q-nego', label: 'Negotiation', icon: 'chatbubbles', webPath: '/team-leader/quotations/negotiation' },
      { id: 'q-approved', label: 'Approved', icon: 'checkmark-circle', webPath: '/team-leader/quotations/approved' },
      { id: 'q-rejected', label: 'Rejected', icon: 'close-circle', webPath: '/team-leader/quotations/rejected' },
      { id: 'q-native', label: 'All Quotes (App)', icon: 'list', native: '/(tabs)/quotes' },
      { id: 'q-new', label: 'Create Quotation', icon: 'add-circle', native: '/quotation/builder' },
    ],
  },
  { id: 'reports', label: 'Reports', icon: 'bar-chart', webPath: '/team-leader/reports' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar-outline', webPath: '/team-leader/calendar' },
  { id: 'notifications', label: 'Notifications', icon: 'notifications', native: '/notifications' },
  { id: 'profile', label: 'Profile', icon: 'person', native: '/(tabs)/profile' },
];

const adminMenu: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'home', native: '/(tabs)' },
  {
    id: 'lead-mgmt',
    label: 'Lead Management',
    icon: 'people',
    children: [
      { id: 'leads-all', label: 'All Leads', icon: 'list', native: '/(tabs)/leads?filter=all' },
      { id: 'leads-new', label: 'New Leads', icon: 'sparkles', native: '/(tabs)/leads?filter=new' },
      { id: 'leads-today', label: "Today's Leads", icon: 'today', webPath: '/leads/new-leads' },
      { id: 'leads-unassigned', label: 'Unassigned Leads', icon: 'file-tray-outline', webPath: '/leads/unassigned' },
      { id: 'leads-assigned', label: 'Assigned Leads', icon: 'checkmark-done', webPath: '/leads/assigned' },
      { id: 'followups', label: 'Follow Ups', icon: 'calendar', native: '/(tabs)/followups' },
      { id: 'reminders', label: 'Reminder Center', icon: 'alarm', webPath: '/reminders' },
      { id: 'leads-hot', label: 'Hot Leads', icon: 'flame', native: '/(tabs)/leads?filter=hot' },
      { id: 'leads-reactivated', label: 'Reactivated Leads', icon: 'refresh', webPath: '/leads/reactivated' },
      { id: 'whatsapp', label: 'WhatsApp Leads', icon: 'logo-whatsapp', webPath: '/whatsapp' },
      { id: 'leads-converted', label: 'Converted Leads', icon: 'trophy', native: '/(tabs)/leads?filter=converted' },
      { id: 'leads-lost', label: 'Lost Leads', icon: 'close-circle', native: '/(tabs)/leads?filter=lost' },
      { id: 'analytics', label: 'Lead Analytics', icon: 'analytics', webPath: '/leads/analytics' },
      { id: 'sla', label: 'SLA Monitor', icon: 'timer', webPath: '/leads/sla' },
      { id: 'audit', label: 'Audit Log', icon: 'document', webPath: '/leads/audit-log' },
      { id: 'recycle', label: 'Recycle Bin', icon: 'trash', webPath: '/leads/recycle-bin' },
    ],
  },
  { id: 'quotations', label: 'Quotations', icon: 'document-text', native: '/(tabs)/quotes' },
  { id: 'quote-new', label: 'Create Quotation', icon: 'add-circle', native: '/quotation/builder' },
  { id: 'packages', label: 'Packages', icon: 'briefcase', webPath: '/packages' },
  { id: 'bookings', label: 'Bookings', icon: 'airplane', webPath: '/operations-manager/bookings/pending' },
  { id: 'payments', label: 'Payments', icon: 'card', webPath: '/payments' },
  { id: 'email', label: 'Email Activity', icon: 'mail', webPath: '/email-activity' },
  { id: 'reports', label: 'Reports', icon: 'bar-chart', webPath: '/reports' },
  { id: 'team', label: 'Users & Roles', icon: 'people-circle', webPath: '/team' },
  { id: 'attendance', label: 'Attendance', icon: 'clipboard', webPath: '/team/attendance' },
  { id: 'settings', label: 'Settings', icon: 'settings', webPath: '/settings' },
  { id: 'notifications', label: 'Notifications', icon: 'notifications', native: '/notifications' },
  { id: 'profile', label: 'Profile', icon: 'person', native: '/(tabs)/profile' },
];

export function getMenuForRole(role?: UserRole | null): MenuItem[] {
  switch (role) {
    case 'sales_manager':
      return managerMenu;
    case 'team_leader':
      return leaderMenu;
    case 'admin':
      return adminMenu;
    case 'sales_executive':
    default:
      return executiveMenu;
  }
}

export function getQuoteBuilderPath(role?: UserRole | null, leadId?: string): string {
  const qs = leadId ? `?leadId=${encodeURIComponent(leadId)}` : '';
  switch (role) {
    case 'sales_manager':
      return `/sales-manager/quotations/new${qs}`;
    case 'team_leader':
      return `/team-leader/quotations/new${qs}`;
    case 'admin':
      return `/quotations/new${qs}`;
    case 'sales_executive':
    default:
      return `/sales-executive/quotations/new${qs}`;
  }
}

/** Full website builder URL path (create or edit existing quote). Same PDF as CRM web. */
export function getQuoteEditorPath(
  role?: UserRole | null,
  opts?: { leadId?: string; quoteId?: string }
): string {
  let path = getQuoteBuilderPath(role, opts?.leadId);
  if (opts?.quoteId) {
    path += `${path.includes('?') ? '&' : '?'}quoteId=${encodeURIComponent(opts.quoteId)}`;
  }
  return path;
}

export function getQuotationsListPath(role?: UserRole | null): string {
  switch (role) {
    case 'sales_manager':
      return '/sales-manager/quotations/pending';
    case 'team_leader':
      return '/team-leader/quotations/pending';
    case 'admin':
      return '/quotations';
    case 'sales_executive':
    default:
      return '/sales-executive/quotations';
  }
}

export function getLeadWebPath(role?: UserRole | null, leadId?: string): string {
  if (!leadId) return '/leads';
  switch (role) {
    case 'sales_manager':
      return `/sales-manager/leads/${leadId}/view`;
    case 'team_leader':
      return `/team-leader/leads/${leadId}/view`;
    case 'sales_executive':
      return `/sales-executive/leads/${leadId}/view`;
    default:
      return `/leads/${leadId}`;
  }
}
