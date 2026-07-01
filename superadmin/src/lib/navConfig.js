import {
  Activity,
  Archive,
  Building2,
  CreditCard,
  FileText,
  Globe,
  Key,
  LayoutDashboard,
  LifeBuoy,
  Megaphone,
  Receipt,
  Server,
  Settings,
  Shield,
  User,
  Users,
  BarChart3,
  Network,
} from 'lucide-react';

export const NAV_SECTIONS = [
  {
    label: 'Platform',
    items: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/admin/companies', label: 'Companies', icon: Building2 },
      { to: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
      { to: '/admin/plans', label: 'Plans', icon: Receipt },
    ],
  },
  {
    label: 'Infrastructure',
    items: [
      { to: '/admin/domains', label: 'Domains', icon: Globe },
      { to: '/admin/dns', label: 'DNS Verification', icon: Network },
      { to: '/admin/invoices', label: 'Invoices', icon: FileText },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/admin/support', label: 'Support Tickets', icon: LifeBuoy },
      { to: '/admin/announcements', label: 'Announcements', icon: Megaphone },
      { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
      { to: '/admin/backups', label: 'Backups', icon: Archive },
    ],
  },
  {
    label: 'Security & System',
    items: [
      { to: '/admin/settings', label: 'System Settings', icon: Settings },
      { to: '/admin/logs', label: 'Audit Logs', icon: Shield },
      { to: '/admin/admins', label: 'Admins', icon: Users },
      { to: '/admin/roles', label: 'Roles & Permissions', icon: Shield },
      { to: '/admin/api-keys', label: 'API Keys', icon: Key },
      { to: '/admin/activity', label: 'Activity Logs', icon: Activity },
    ],
  },
];

export const PROFILE_NAV = { to: '/admin/profile', label: 'Profile', icon: User };
