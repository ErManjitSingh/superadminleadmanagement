import {
  LayoutDashboard,
  Users,
  Inbox,
  UserCheck,
  CalendarClock,
  Trophy,
  XCircle,
  RefreshCw,
  MessageCircle,
  Contact,
  FileText,
  Globe2,
  UsersRound,
  BarChart3,
  Calendar,
  Bell,
  Settings,
  Clock,
  MapPin,
  Award,
} from 'lucide-react';

export const teamManagementItems = [
  {
    path: '/team',
    label: 'Users & Roles',
    icon: UsersRound,
    permission: { module: 'users', action: 'view' },
  },
  {
    path: '/team/attendance',
    label: 'Attendance',
    icon: Clock,
    roles: ['admin'],
  },
  {
    path: '/team/destination-assignment',
    label: 'Destination Assignment',
    icon: MapPin,
    roles: ['admin', 'sales_manager'],
  },
  {
    path: '/team/skill-assignment',
    label: 'Skill Assignment',
    icon: Award,
    roles: ['admin', 'sales_manager'],
  },
];

export const leadManagementItems = [
  { path: '/leads', label: 'All Leads', icon: Users, countKey: 'leads.all', permission: { module: 'leads', action: 'view' } },
  { path: '/leads/new-leads', label: 'New Leads', icon: Inbox, badgeKey: 'leads.new', permission: { module: 'leads', action: 'view' } },
  { path: '/leads/unassigned', label: 'Unassigned Leads', icon: Inbox, badgeKey: 'leads.unassigned', permission: { module: 'leads', action: 'view' } },
  { path: '/leads/assigned', label: 'Assigned Leads', icon: UserCheck, countKey: 'leads.assigned', permission: { module: 'leads', action: 'view' } },
  { path: '/followups', label: 'Follow Ups', icon: CalendarClock, badgeKey: 'followups.due', countKey: 'followups.total', permission: { module: 'leads', action: 'view' } },
  { path: '/leads/converted', label: 'Converted Leads', icon: Trophy, countKey: 'leads.converted', permission: { module: 'leads', action: 'view' } },
  { path: '/leads/lost', label: 'Lost Leads', icon: XCircle, countKey: 'leads.lost', permission: { module: 'leads', action: 'view' } },
  { path: '/leads/reactivated', label: 'Reactivated Leads', icon: RefreshCw, permission: { module: 'leads', action: 'view' } },
  { path: '/whatsapp', label: 'WhatsApp Leads', icon: MessageCircle, countKey: 'leads.whatsapp', permission: { module: 'leads', action: 'view' } },
];

export const mainNavItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  {
    id: 'lead-management',
    label: 'Lead Management',
    icon: Users,
    children: leadManagementItems,
  },
  { path: '/customers', label: 'Customers', icon: Contact, countKey: 'customers', permission: { module: 'customers', action: 'view' } },
  { path: '/quotations', label: 'Quotations', icon: FileText, badgeKey: 'quotations.pending', permission: { module: 'quotations', action: 'view' } },
  { path: '/packages', label: 'Packages', icon: Globe2, countKey: 'packages', permission: { module: 'packages', action: 'view' } },
  {
    id: 'team-management',
    label: 'Team Management',
    icon: UsersRound,
    children: teamManagementItems,
  },
  { path: '/reports', label: 'Reports', icon: BarChart3, permission: { module: 'reports', action: 'view' } },
  { path: '/calendar', label: 'Calendar', icon: Calendar, badgeKey: 'calendar.today' },
  { path: '/notifications', label: 'Notifications', icon: Bell, badgeKey: 'notifications.unread' },
  { path: '/settings', label: 'Settings', icon: Settings },
];
