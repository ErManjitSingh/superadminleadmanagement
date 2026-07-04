import {
  LayoutDashboard,
  Users,
  Building2,
  Clock,
  RotateCcw,
  FileText,
  Link2,
  ArrowLeftRight,
  BarChart3,
  Settings,
} from 'lucide-react';

export const paymentsMenuChildren = [
  { path: '/payments/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/payments/customers', label: 'Customer Payments', icon: Users },
  { path: '/payments/suppliers', label: 'Supplier Payments', icon: Building2 },
  { path: '/payments/pending', label: 'Pending Payments', icon: Clock },
  { path: '/payments/refunds', label: 'Refunds', icon: RotateCcw },
  { path: '/payments/invoices', label: 'Invoices', icon: FileText },
  { path: '/payments/links', label: 'Payment Links', icon: Link2 },
  { path: '/payments/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { path: '/payments/reports', label: 'Reports', icon: BarChart3 },
  { path: '/payments/settings', label: 'Settings', icon: Settings },
];
