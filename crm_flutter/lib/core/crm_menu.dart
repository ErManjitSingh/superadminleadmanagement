import 'package:flutter/material.dart';

/// A menu entry that opens a NATIVE Flutter screen (see `ModuleRouter`).
class CrmMenuItem {
  const CrmMenuItem({
    required this.id,
    required this.label,
    required this.icon,
    this.nativeId,
    this.filter,
    this.children,
  });

  final String id;
  final String label;
  final IconData icon;

  /// Native screen id resolved by `ModuleRouter` (never a web path).
  final String? nativeId;

  /// Optional deep-link filter handed to the native screen
  /// (lead filter, quote status, booking status, voucher type, reminder tab…).
  final String? filter;
  final List<CrmMenuItem>? children;
}

List<CrmMenuItem> menuForRole(String? role) {
  switch (role) {
    case 'sales_manager':
      return _manager;
    case 'team_leader':
      return _leader;
    case 'operations_manager':
      return _ops;
    case 'admin':
      return _admin;
    case 'sales_executive':
    default:
      return _executive;
  }
}

const _executive = <CrmMenuItem>[
  CrmMenuItem(id: 'dash', label: 'Dashboard', icon: Icons.home_rounded, nativeId: 'home'),
  CrmMenuItem(
    id: 'leads',
    label: 'My Leads',
    icon: Icons.people_alt_rounded,
    children: [
      CrmMenuItem(id: 'l-new', label: 'New Leads', icon: Icons.auto_awesome, nativeId: 'leads', filter: 'new'),
      CrmMenuItem(id: 'l-all', label: 'All Leads', icon: Icons.list_alt_rounded, nativeId: 'leads', filter: 'all'),
      CrmMenuItem(id: 'l-contacted', label: 'Contacted', icon: Icons.call, nativeId: 'leads', filter: 'contacted'),
      CrmMenuItem(id: 'l-follow', label: 'Follow-up Leads', icon: Icons.event, nativeId: 'leads', filter: 'follow-up'),
      CrmMenuItem(id: 'l-hot', label: 'Hot Leads', icon: Icons.local_fire_department, nativeId: 'leads', filter: 'hot'),
      CrmMenuItem(id: 'l-react', label: 'Reactivated', icon: Icons.refresh, nativeId: 'leads', filter: 'reactivated'),
      CrmMenuItem(id: 'l-conv', label: 'Converted', icon: Icons.emoji_events, nativeId: 'leads', filter: 'converted'),
      CrmMenuItem(id: 'l-lost', label: 'Lost', icon: Icons.close, nativeId: 'leads', filter: 'lost'),
    ],
  ),
  CrmMenuItem(id: 'quotes', label: 'Quotations', icon: Icons.description_rounded, nativeId: 'quotes'),
  CrmMenuItem(id: 'q-new', label: 'Create Quotation', icon: Icons.add_circle_outline, nativeId: 'quote_new'),
  CrmMenuItem(id: 'follow', label: 'Follow-ups', icon: Icons.event_available, nativeId: 'followups'),
  CrmMenuItem(id: 'remind', label: 'Reminders', icon: Icons.alarm, nativeId: 'reminders'),
  CrmMenuItem(id: 'customers', label: 'Customers', icon: Icons.person_pin_rounded, nativeId: 'customers'),
  CrmMenuItem(id: 'calendar', label: 'Calendar', icon: Icons.calendar_month, nativeId: 'calendar'),
  CrmMenuItem(id: 'email', label: 'Email Activity', icon: Icons.mail_outline, nativeId: 'email'),
  CrmMenuItem(id: 'attendance', label: 'Attendance', icon: Icons.fact_check_outlined, nativeId: 'attendance'),
  CrmMenuItem(id: 'notif', label: 'Notifications', icon: Icons.notifications_outlined, nativeId: 'notifications'),
  CrmMenuItem(id: 'profile', label: 'Profile', icon: Icons.person_outline, nativeId: 'profile'),
];

const _manager = <CrmMenuItem>[
  CrmMenuItem(id: 'dash', label: 'Dashboard', icon: Icons.home_rounded, nativeId: 'home'),
  CrmMenuItem(
    id: 'leads',
    label: 'Lead Management',
    icon: Icons.people_alt_rounded,
    children: [
      CrmMenuItem(id: 'l-all', label: 'All Leads', icon: Icons.list_alt, nativeId: 'leads', filter: 'all'),
      CrmMenuItem(id: 'l-un', label: 'Unassigned', icon: Icons.inbox_outlined, nativeId: 'leads', filter: 'unassigned'),
      CrmMenuItem(id: 'l-as', label: 'Assigned', icon: Icons.done_all, nativeId: 'leads', filter: 'assigned'),
      CrmMenuItem(id: 'l-hot', label: 'Hot Leads', icon: Icons.local_fire_department, nativeId: 'leads', filter: 'hot'),
      CrmMenuItem(id: 'l-lost', label: 'Lost Leads', icon: Icons.close, nativeId: 'leads', filter: 'lost'),
      CrmMenuItem(id: 'l-react', label: 'Reactivated', icon: Icons.refresh, nativeId: 'leads', filter: 'reactivated'),
    ],
  ),
  CrmMenuItem(id: 'email', label: 'Email Activity', icon: Icons.mail_outline, nativeId: 'email'),
  CrmMenuItem(id: 'assign', label: 'Lead Assignment', icon: Icons.person_add_alt_1, nativeId: 'assignment'),
  CrmMenuItem(id: 'dest', label: 'Destination Assignment', icon: Icons.place_outlined, nativeId: 'dest_assignment'),
  CrmMenuItem(id: 'skill', label: 'Skill Assignment', icon: Icons.military_tech_outlined, nativeId: 'skill_assignment'),
  CrmMenuItem(id: 'teams', label: 'Team Management', icon: Icons.groups_rounded, nativeId: 'teams'),
  CrmMenuItem(id: 'follow', label: 'Follow-up Monitoring', icon: Icons.event_available, nativeId: 'followups'),
  CrmMenuItem(id: 'remind', label: 'Reminders', icon: Icons.alarm, nativeId: 'reminders'),
  CrmMenuItem(id: 'perf', label: 'Team Performance', icon: Icons.emoji_events_outlined, nativeId: 'team_perf'),
  CrmMenuItem(id: 'attendance', label: 'Attendance', icon: Icons.fact_check_outlined, nativeId: 'attendance'),
  CrmMenuItem(
    id: 'quotes',
    label: 'Quotations',
    icon: Icons.description_rounded,
    children: [
      CrmMenuItem(id: 'q-new', label: 'Create Quotation', icon: Icons.add_circle_outline, nativeId: 'quote_new'),
      CrmMenuItem(id: 'q-all', label: 'All Quotations', icon: Icons.description_outlined, nativeId: 'quotes'),
      CrmMenuItem(id: 'q-sent', label: 'Quotation Sent', icon: Icons.send, nativeId: 'quotes', filter: 'sent'),
      CrmMenuItem(id: 'q-pend', label: 'Pending Approval', icon: Icons.schedule, nativeId: 'quotes', filter: 'pending'),
      CrmMenuItem(id: 'q-ok', label: 'Approved', icon: Icons.check_circle_outline, nativeId: 'quotes', filter: 'approved'),
      CrmMenuItem(id: 'q-no', label: 'Rejected', icon: Icons.cancel_outlined, nativeId: 'quotes', filter: 'rejected'),
    ],
  ),
  CrmMenuItem(
    id: 'ops',
    label: 'Operations',
    icon: Icons.work_outline,
    children: [
      CrmMenuItem(id: 'ops-dash', label: 'Ops Dashboard', icon: Icons.dashboard_outlined, nativeId: 'ops_home'),
      CrmMenuItem(id: 'ops-book', label: 'Bookings', icon: Icons.flight_takeoff, nativeId: 'ops_bookings', filter: 'pending'),
      CrmMenuItem(id: 'ops-vouch', label: 'Vouchers', icon: Icons.confirmation_number_outlined, nativeId: 'ops_vouchers'),
      CrmMenuItem(id: 'ops-tasks', label: 'Tasks', icon: Icons.checklist, nativeId: 'ops_tasks'),
    ],
  ),
  CrmMenuItem(id: 'reports', label: 'Reports', icon: Icons.bar_chart_rounded, nativeId: 'reports'),
  CrmMenuItem(id: 'calendar', label: 'Calendar', icon: Icons.calendar_month, nativeId: 'calendar'),
  CrmMenuItem(id: 'notif', label: 'Notifications', icon: Icons.notifications_outlined, nativeId: 'notifications'),
  CrmMenuItem(id: 'profile', label: 'Profile', icon: Icons.person_outline, nativeId: 'profile'),
];

const _leader = <CrmMenuItem>[
  CrmMenuItem(id: 'dash', label: 'Dashboard', icon: Icons.home_rounded, nativeId: 'home'),
  CrmMenuItem(
    id: 'leads',
    label: 'Lead Management',
    icon: Icons.people_alt_rounded,
    children: [
      CrmMenuItem(id: 'l-all', label: 'Team Leads', icon: Icons.list_alt, nativeId: 'leads', filter: 'all'),
      CrmMenuItem(id: 'l-lost', label: 'Lost Leads', icon: Icons.close, nativeId: 'leads', filter: 'lost'),
      CrmMenuItem(id: 'l-react', label: 'Reactivated', icon: Icons.refresh, nativeId: 'leads', filter: 'reactivated'),
    ],
  ),
  CrmMenuItem(id: 'email', label: 'Email Activity', icon: Icons.mail_outline, nativeId: 'email'),
  CrmMenuItem(id: 'follow', label: 'Team Follow-ups', icon: Icons.event_available, nativeId: 'followups'),
  CrmMenuItem(id: 'remind', label: 'Reminders', icon: Icons.alarm, nativeId: 'reminders'),
  CrmMenuItem(id: 'perf', label: 'Executive Performance', icon: Icons.emoji_events_outlined, nativeId: 'team_perf'),
  CrmMenuItem(id: 'attendance', label: 'Attendance', icon: Icons.fact_check_outlined, nativeId: 'attendance'),
  CrmMenuItem(id: 'esc', label: 'Lead Escalations', icon: Icons.warning_amber_rounded, nativeId: 'escalations'),
  CrmMenuItem(
    id: 'quotes',
    label: 'Quotations',
    icon: Icons.description_rounded,
    children: [
      CrmMenuItem(id: 'q-all', label: 'All Quotations', icon: Icons.description_outlined, nativeId: 'quotes'),
      CrmMenuItem(id: 'q-pend', label: 'Pending', icon: Icons.schedule, nativeId: 'quotes', filter: 'pending'),
      CrmMenuItem(id: 'q-nego', label: 'Negotiation', icon: Icons.forum_outlined, nativeId: 'quotes', filter: 'negotiation'),
      CrmMenuItem(id: 'q-ok', label: 'Approved', icon: Icons.check_circle_outline, nativeId: 'quotes', filter: 'approved'),
      CrmMenuItem(id: 'q-no', label: 'Rejected', icon: Icons.cancel_outlined, nativeId: 'quotes', filter: 'rejected'),
      CrmMenuItem(id: 'q-new', label: 'Create Quotation', icon: Icons.add_circle_outline, nativeId: 'quote_new'),
    ],
  ),
  CrmMenuItem(id: 'reports', label: 'Reports', icon: Icons.bar_chart_rounded, nativeId: 'reports'),
  CrmMenuItem(id: 'calendar', label: 'Calendar', icon: Icons.calendar_month, nativeId: 'calendar'),
  CrmMenuItem(id: 'notif', label: 'Notifications', icon: Icons.notifications_outlined, nativeId: 'notifications'),
  CrmMenuItem(id: 'profile', label: 'Profile', icon: Icons.person_outline, nativeId: 'profile'),
];

const _ops = <CrmMenuItem>[
  CrmMenuItem(id: 'dash', label: 'Ops Dashboard', icon: Icons.dashboard_customize, nativeId: 'ops_home'),
  CrmMenuItem(
    id: 'bookings',
    label: 'Bookings',
    icon: Icons.flight_takeoff,
    children: [
      CrmMenuItem(id: 'b-all', label: 'All bookings', icon: Icons.list_alt, nativeId: 'ops_bookings'),
      CrmMenuItem(id: 'b-pend', label: 'Pending', icon: Icons.schedule, nativeId: 'ops_bookings', filter: 'pending'),
      CrmMenuItem(id: 'b-conf', label: 'Confirmed', icon: Icons.check_circle_outline, nativeId: 'ops_bookings', filter: 'confirmed'),
      CrmMenuItem(id: 'b-act', label: 'Active', icon: Icons.play_circle_outline, nativeId: 'ops_bookings', filter: 'active'),
      CrmMenuItem(id: 'b-done', label: 'Completed', icon: Icons.flag_outlined, nativeId: 'ops_bookings', filter: 'completed'),
    ],
  ),
  CrmMenuItem(
    id: 'trips',
    label: 'Trip Execution',
    icon: Icons.alt_route,
    children: [
      CrmMenuItem(id: 't-dash', label: 'Execution', icon: Icons.timeline, nativeId: 'ops_bookings', filter: 'active'),
      CrmMenuItem(id: 't-act', label: 'Active trips', icon: Icons.navigation_outlined, nativeId: 'ops_bookings', filter: 'active'),
      CrmMenuItem(id: 't-up', label: 'Upcoming', icon: Icons.upcoming, nativeId: 'ops_bookings', filter: 'confirmed'),
      CrmMenuItem(id: 't-done', label: 'Completed', icon: Icons.done_all, nativeId: 'ops_bookings', filter: 'completed'),
      CrmMenuItem(id: 't-track', label: 'Trip Tracker', icon: Icons.map_outlined, nativeId: 'ops_tracker'),
    ],
  ),
  CrmMenuItem(
    id: 'vouchers',
    label: 'Vouchers',
    icon: Icons.confirmation_number_outlined,
    children: [
      CrmMenuItem(id: 'v-all', label: 'All vouchers', icon: Icons.confirmation_number, nativeId: 'ops_vouchers', filter: 'all'),
      CrmMenuItem(id: 'v-hotel', label: 'Hotel', icon: Icons.hotel, nativeId: 'ops_vouchers', filter: 'hotel'),
      CrmMenuItem(id: 'v-cab', label: 'Cab', icon: Icons.directions_car, nativeId: 'ops_vouchers', filter: 'cab'),
      CrmMenuItem(id: 'v-act', label: 'Activity', icon: Icons.hiking, nativeId: 'ops_vouchers', filter: 'activity'),
      CrmMenuItem(id: 'v-flight', label: 'Flight', icon: Icons.flight, nativeId: 'ops_vouchers', filter: 'flight'),
      CrmMenuItem(id: 'v-kit', label: 'Travel kit', icon: Icons.backpack_outlined, nativeId: 'ops_vouchers', filter: 'travel-kit'),
    ],
  ),
  CrmMenuItem(
    id: 'vendors',
    label: 'Vendors',
    icon: Icons.storefront_outlined,
    children: [
      CrmMenuItem(id: 'vd-all', label: 'All vendors', icon: Icons.business, nativeId: 'ops_vendors'),
      CrmMenuItem(id: 'vd-hotels', label: 'Hotels', icon: Icons.hotel, nativeId: 'ops_hotels'),
      CrmMenuItem(id: 'vd-cabs', label: 'Transport', icon: Icons.airport_shuttle, nativeId: 'ops_transport'),
      CrmMenuItem(id: 'vd-act', label: 'Activities', icon: Icons.explore_outlined, nativeId: 'ops_activities'),
      CrmMenuItem(id: 'vd-conf', label: 'Confirmations', icon: Icons.verified_outlined, nativeId: 'ops_vendors', filter: 'confirmations'),
    ],
  ),
  CrmMenuItem(id: 'tasks', label: 'Tasks', icon: Icons.checklist, nativeId: 'ops_tasks'),
  CrmMenuItem(id: 'payments', label: 'Payments', icon: Icons.payments_outlined, nativeId: 'payments'),
  CrmMenuItem(id: 'alerts', label: 'Alerts', icon: Icons.notification_important_outlined, nativeId: 'ops_home'),
  CrmMenuItem(id: 'esc', label: 'Escalations', icon: Icons.warning_amber, nativeId: 'ops_support'),
  CrmMenuItem(id: 'support', label: 'Support', icon: Icons.support_agent, nativeId: 'ops_support'),
  CrmMenuItem(id: 'attendance', label: 'Attendance', icon: Icons.fact_check_outlined, nativeId: 'attendance'),
  CrmMenuItem(id: 'calendar', label: 'Calendar', icon: Icons.calendar_month, nativeId: 'calendar'),
  CrmMenuItem(id: 'reports', label: 'Reports', icon: Icons.bar_chart, nativeId: 'reports'),
  CrmMenuItem(id: 'notif', label: 'Notifications', icon: Icons.notifications_outlined, nativeId: 'notifications'),
  CrmMenuItem(id: 'profile', label: 'Profile', icon: Icons.person_outline, nativeId: 'profile'),
];

const _admin = <CrmMenuItem>[
  CrmMenuItem(id: 'dash', label: 'Dashboard', icon: Icons.home_rounded, nativeId: 'home'),
  CrmMenuItem(
    id: 'leads',
    label: 'Lead Management',
    icon: Icons.people_alt_rounded,
    children: [
      CrmMenuItem(id: 'l-all', label: 'All Leads', icon: Icons.list_alt, nativeId: 'leads', filter: 'all'),
      CrmMenuItem(id: 'l-new', label: 'New Leads', icon: Icons.auto_awesome, nativeId: 'leads', filter: 'new'),
      CrmMenuItem(id: 'l-today', label: "Today's Leads", icon: Icons.today, nativeId: 'leads', filter: 'today'),
      CrmMenuItem(id: 'l-un', label: 'Unassigned', icon: Icons.inbox_outlined, nativeId: 'leads', filter: 'unassigned'),
      CrmMenuItem(id: 'l-as', label: 'Assigned', icon: Icons.done_all, nativeId: 'leads', filter: 'assigned'),
      CrmMenuItem(id: 'l-hot', label: 'Hot Leads', icon: Icons.local_fire_department, nativeId: 'leads', filter: 'hot'),
      CrmMenuItem(id: 'l-react', label: 'Reactivated', icon: Icons.refresh, nativeId: 'leads', filter: 'reactivated'),
      CrmMenuItem(id: 'l-wa', label: 'WhatsApp Leads', icon: Icons.chat, nativeId: 'whatsapp'),
      CrmMenuItem(id: 'l-conv', label: 'Converted', icon: Icons.emoji_events, nativeId: 'leads', filter: 'converted'),
      CrmMenuItem(id: 'l-lost', label: 'Lost', icon: Icons.close, nativeId: 'leads', filter: 'lost'),
      CrmMenuItem(id: 'l-an', label: 'Lead Analytics', icon: Icons.analytics_outlined, nativeId: 'lead_analytics'),
      CrmMenuItem(id: 'l-sla', label: 'SLA Monitor', icon: Icons.timer_outlined, nativeId: 'lead_sla'),
      CrmMenuItem(id: 'l-audit', label: 'Audit Log', icon: Icons.history, nativeId: 'lead_audit'),
      CrmMenuItem(id: 'l-bin', label: 'Recycle Bin', icon: Icons.delete_outline, nativeId: 'lead_recycle'),
    ],
  ),
  CrmMenuItem(id: 'assign', label: 'Lead Assignment', icon: Icons.person_add_alt_1, nativeId: 'assignment'),
  CrmMenuItem(id: 'follow', label: 'Follow Ups', icon: Icons.event_available, nativeId: 'followups'),
  CrmMenuItem(id: 'remind', label: 'Reminder Center', icon: Icons.alarm, nativeId: 'reminders'),
  CrmMenuItem(id: 'quotes', label: 'Quotations', icon: Icons.description_rounded, nativeId: 'quotes'),
  CrmMenuItem(id: 'q-new', label: 'Create Quotation', icon: Icons.add_circle_outline, nativeId: 'quote_new'),
  CrmMenuItem(id: 'packages', label: 'Packages', icon: Icons.card_travel, nativeId: 'packages'),
  CrmMenuItem(id: 'bookings', label: 'Bookings', icon: Icons.flight_takeoff, nativeId: 'ops_bookings', filter: 'pending'),
  CrmMenuItem(id: 'payments', label: 'Payments', icon: Icons.payments_outlined, nativeId: 'payments'),
  CrmMenuItem(id: 'customers', label: 'Customers', icon: Icons.person_pin_rounded, nativeId: 'customers'),
  CrmMenuItem(id: 'calendar', label: 'Calendar', icon: Icons.calendar_month, nativeId: 'calendar'),
  CrmMenuItem(id: 'email', label: 'Email Activity', icon: Icons.mail_outline, nativeId: 'email'),
  CrmMenuItem(id: 'reports', label: 'Reports', icon: Icons.bar_chart_rounded, nativeId: 'reports'),
  CrmMenuItem(id: 'team', label: 'Users & Roles', icon: Icons.groups_rounded, nativeId: 'team'),
  CrmMenuItem(id: 'teams', label: 'Teams', icon: Icons.diversity_3, nativeId: 'teams'),
  CrmMenuItem(id: 'attendance', label: 'Attendance', icon: Icons.fact_check_outlined, nativeId: 'attendance'),
  CrmMenuItem(
    id: 'ops',
    label: 'Operations',
    icon: Icons.work_outline,
    children: [
      CrmMenuItem(id: 'ops-dash', label: 'Ops Dashboard', icon: Icons.dashboard_outlined, nativeId: 'ops_home'),
      CrmMenuItem(id: 'ops-trip', label: 'Trip Execution', icon: Icons.timeline, nativeId: 'ops_bookings', filter: 'active'),
      CrmMenuItem(id: 'ops-vouch', label: 'Vouchers', icon: Icons.confirmation_number_outlined, nativeId: 'ops_vouchers'),
      CrmMenuItem(id: 'ops-vend', label: 'Vendors', icon: Icons.storefront_outlined, nativeId: 'ops_vendors'),
      CrmMenuItem(id: 'ops-tasks', label: 'Tasks', icon: Icons.checklist, nativeId: 'ops_tasks'),
    ],
  ),
  CrmMenuItem(
    id: 'settings',
    label: 'Settings',
    icon: Icons.settings_outlined,
    children: [
      CrmMenuItem(id: 's-main', label: 'Settings Home', icon: Icons.tune, nativeId: 'settings_company'),
      CrmMenuItem(id: 's-prof', label: 'Company Profile', icon: Icons.business, nativeId: 'settings_company'),
      CrmMenuItem(id: 's-work', label: 'Workspace', icon: Icons.domain, nativeId: 'settings_workspace'),
      CrmMenuItem(id: 's-sub', label: 'Subscription', icon: Icons.workspace_premium_outlined, nativeId: 'settings_subscription'),
      CrmMenuItem(id: 's-email', label: 'Email Integration', icon: Icons.alternate_email, nativeId: 'settings_email'),
      CrmMenuItem(id: 's-etpl', label: 'Email Templates', icon: Icons.mail_outline, nativeId: 'settings_email_templates'),
      CrmMenuItem(id: 's-wa', label: 'WhatsApp Templates', icon: Icons.chat, nativeId: 'settings_wa_templates'),
    ],
  ),
  CrmMenuItem(id: 'notif', label: 'Notifications', icon: Icons.notifications_outlined, nativeId: 'notifications'),
  CrmMenuItem(id: 'profile', label: 'Profile', icon: Icons.person_outline, nativeId: 'profile'),
];
