import {
  Building2,
  CreditCard,
  FileText,
  Globe,
  LayoutDashboard,
  LifeBuoy,
  Megaphone,
  Network,
  SlidersHorizontal,
  Puzzle,
  Receipt,
  Rocket,
  Settings,
  Shield,
  BarChart3,
  Wallet,
} from 'lucide-react';

export const NAV_SECTIONS = [
  {
    label: 'Platform',
    items: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/admin/companies', label: 'Companies', icon: Building2 },
      { to: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
      { to: '/admin/payment-requests', label: 'Payment Requests', icon: Wallet, badgeKey: 'payments' },
      { to: '/admin/plans', label: 'Plans', icon: Receipt },
      { to: '/admin/features', label: 'Platform Features', icon: SlidersHorizontal },
      { to: '/admin/plans', label: 'Add-ons', icon: Puzzle },
    ],
  },
  {
    label: 'Infrastructure',
    items: [
      { to: '/admin/domains', label: 'Domains', icon: Globe },
      { to: '/admin/dns', label: 'DNS Verification', icon: Network },
      { to: '/admin/invoices', label: 'Invoices', icon: FileText },
      { to: '/admin/settings', label: 'Payment Gateways', icon: Wallet },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/admin/support', label: 'Support Tickets', icon: LifeBuoy, badgeKey: 'tickets' },
      { to: '/admin/announcements', label: 'Announcements', icon: Megaphone },
      { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
      { to: '/admin/logs', label: 'Audit Logs', icon: Shield },
    ],
  },
];

export const SETTINGS_NAV = { to: '/admin/settings', label: 'Settings', icon: Settings };
