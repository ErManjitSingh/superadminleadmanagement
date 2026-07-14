import {
  LayoutDashboard,
  ClipboardList,
  Clock,
  CheckCircle2,
  Plane,
  CircleCheck,
  Hotel,
  Car,
  Compass,
  Building2,
  Ticket,
  Headphones,
  Calendar,
  BarChart3,
  User,
  MapPin,
  ListTodo,
  BookOpen,
  PlaneTakeoff,
  Bell,
  AlertTriangle,
} from 'lucide-react';

export const operationsBookingsChildren = [
  { path: '/operations-manager/bookings/pending', label: 'Pending', icon: Clock, badgeKey: 'bookings.pending' },
  { path: '/operations-manager/bookings/confirmed', label: 'Confirmed', icon: CheckCircle2, countKey: 'bookings.confirmed' },
  { path: '/operations-manager/bookings/active', label: 'Active Trips', icon: Plane, badgeKey: 'bookings.active' },
  { path: '/operations-manager/bookings/completed', label: 'Completed Trips', icon: CircleCheck, countKey: 'bookings.completed' },
];

export const tripExecutionChildren = [
  { path: '/operations-manager/trip-execution', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/operations-manager/trips/active', label: 'Active Trips', icon: Plane },
  { path: '/operations-manager/trips/upcoming', label: 'Upcoming Trips', icon: Clock },
  { path: '/operations-manager/trips/completed', label: 'Completed Trips', icon: CircleCheck },
];

export const vouchersNavChildren = [
  { path: '/operations-manager/vouchers', label: 'All Vouchers', icon: Ticket },
  { path: '/operations-manager/vouchers/hotel', label: 'Hotel Vouchers', icon: Hotel },
  { path: '/operations-manager/vouchers/cab', label: 'Cab Vouchers', icon: Car },
  { path: '/operations-manager/vouchers/activity', label: 'Activity Vouchers', icon: Compass },
  { path: '/operations-manager/vouchers/flight', label: 'Flight Vouchers', icon: PlaneTakeoff },
  { path: '/operations-manager/vouchers/travel-kit', label: 'Customer Travel Kits', icon: BookOpen },
];

export const vendorsNavChildren = [
  { path: '/operations-manager/vendors', label: 'All Vendors', icon: Building2 },
  { path: '/operations-manager/hotels', label: 'Hotels', icon: Hotel },
  { path: '/operations-manager/transport', label: 'Cab Vendors', icon: Car },
  { path: '/operations-manager/activities', label: 'Activity Vendors', icon: Compass },
  { path: '/operations-manager/vendors/confirmations', label: 'Vendor Confirmations', icon: CheckCircle2 },
];

export const operationsNavChildren = [
  { path: '/operations-manager/tasks', label: 'Tasks', icon: ListTodo, badgeKey: 'tasks.pending' },
  { path: '/operations-manager/operations/alerts', label: 'Alerts', icon: Bell },
  { path: '/operations-manager/operations/escalations', label: 'Escalations', icon: AlertTriangle },
  { path: '/operations-manager/support', label: 'Support Tickets', icon: Headphones, badgeKey: 'support.open' },
];

export const operationsInsightsChildren = [
  { path: '/operations-manager/calendar', label: 'Calendar', icon: Calendar },
  { path: '/operations-manager/reports', label: 'Reports', icon: BarChart3 },
];

/** Flat list for admin sidebar */
export const operationsAdminMenuChildren = [
  { path: '/operations-manager/dashboard', label: 'Ops Dashboard', icon: LayoutDashboard },
  ...operationsBookingsChildren,
  ...tripExecutionChildren,
  ...vouchersNavChildren,
  ...vendorsNavChildren,
  ...operationsNavChildren,
  ...operationsInsightsChildren,
];

/** Grouped main menu for Operations Manager layout — matches Command Center sidebar */
export const operationsManagerNavItems = [
  { path: '/operations-manager/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    id: 'ops-bookings',
    label: 'Bookings',
    icon: ClipboardList,
    children: operationsBookingsChildren,
  },
  {
    id: 'ops-trip-execution',
    label: 'Trip Execution',
    icon: MapPin,
    children: tripExecutionChildren,
  },
  {
    id: 'ops-vouchers',
    label: 'Vouchers',
    icon: Ticket,
    children: vouchersNavChildren,
  },
  {
    id: 'ops-vendors',
    label: 'Vendors',
    icon: Building2,
    children: vendorsNavChildren,
  },
  {
    id: 'ops-operations',
    label: 'Operations',
    icon: ListTodo,
    children: operationsNavChildren,
  },
  {
    id: 'ops-insights',
    label: 'Insights',
    icon: BarChart3,
    children: operationsInsightsChildren,
  },
  { path: '/operations-manager/reports', label: 'Reports', icon: BarChart3 },
  { path: '/operations-manager/tasks', label: 'Tasks', icon: ListTodo, badgeKey: 'tasks.pending' },
  { path: '/operations-manager/operations/alerts', label: 'Alerts', icon: Bell },
  { path: '/operations-manager/profile', label: 'Profile', icon: User },
];

export const operationsQuickActions = [
  { path: '/operations-manager/trip-execution', label: 'Trip Execution', icon: MapPin },
  { path: '/operations-manager/vouchers', label: 'Voucher Center', icon: Ticket },
  { path: '/operations-manager/trips/active', label: 'Active Trips', icon: Plane },
  { path: '/operations-manager/vendors/confirmations', label: 'Vendor Confirmation', icon: Building2 },
  { path: '/operations-manager/tasks', label: 'Assign Tasks', icon: ListTodo },
];

// Legacy exports for backward compatibility
export const operationsExecutionChildren = tripExecutionChildren;
export const operationsResourcesChildren = vouchersNavChildren;
