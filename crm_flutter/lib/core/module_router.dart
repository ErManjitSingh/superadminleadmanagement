import 'package:flutter/material.dart';

import '../screens/assignment_screen.dart';
import '../screens/attendance_screen.dart';
import '../screens/calendar_screen.dart';
import '../screens/customers_screen.dart';
import '../screens/dashboard_screen.dart';
import '../screens/email_activity_screen.dart';
import '../screens/escalations_screen.dart';
import '../screens/followups_screen.dart';
import '../screens/generic_api_screen.dart';
import '../screens/leads_screen.dart';
import '../screens/notifications_screen.dart';
import '../screens/operations_home_screen.dart';
import '../screens/ops_bookings_screen.dart';
import '../screens/ops_tasks_screen.dart';
import '../screens/ops_vouchers_screen.dart';
import '../screens/packages_screen.dart';
import '../screens/payments_screen.dart';
import '../screens/profile_screen.dart';
import '../screens/quote_builder_screen.dart';
import '../screens/quotes_screen.dart';
import '../screens/reminders_screen.dart';
import '../screens/reports_screen.dart';
import '../screens/team_screen.dart';
import '../screens/teams_management_screen.dart';
import '../screens/whatsapp_leads_screen.dart';
import '../widgets/common_widgets.dart' show EmptyState;
import '../widgets/emb_widgets.dart';
import 'emb_theme.dart';

/// Maps a menu `nativeId` (+ optional filter) to a NATIVE Flutter screen.
/// No WebView / browser fallbacks exist.
class ModuleRouter {
  const ModuleRouter._();

  /// Pushes the native screen for [nativeId].
  static Future<T?> open<T>(
    BuildContext context,
    String nativeId, {
    String? filter,
    String? title,
  }) {
    return Navigator.of(context).push<T>(
      MaterialPageRoute(builder: (_) => build(nativeId, filter: filter, title: title)),
    );
  }

  /// Returns the widget for [nativeId]. Always a full page (has its own Scaffold).
  static Widget build(String nativeId, {String? filter, String? title}) {
    final f = filter ?? '';
    switch (nativeId) {
      // ── Home / generic ──
      case 'home':
        return _Page(title: title ?? 'Dashboard', child: const DashboardScreen());
      case 'profile':
        return _Page(title: title ?? 'Profile', child: const ProfileScreen());
      case 'notifications':
        return const NotificationsScreen();

      // ── Sales ──
      case 'leads':
        return _Page(
          title: title ?? 'Leads',
          child: LeadsScreen(
            key: ValueKey('leads-${f.isEmpty ? 'all' : f}'),
            initialFilter: f.isEmpty ? null : f,
          ),
        );
      case 'quotes':
        return _Page(
          title: title ?? 'Quotations',
          child: QuotesScreen(
            key: ValueKey('quotes-${f.isEmpty ? 'all' : f}'),
            initialStatus: f,
          ),
        );
      case 'quote_new':
        return const QuoteBuilderScreen();
      case 'followups':
        return _Page(title: title ?? 'Follow-ups', child: const FollowupsScreen());
      case 'reminders':
        return RemindersScreen(initialTab: f.isEmpty ? 'today' : f);
      case 'customers':
        return const CustomersScreen();
      case 'calendar':
        return const CalendarScreen();
      case 'assignment':
        return const AssignmentScreen();
      case 'whatsapp':
        return const WhatsappLeadsScreen();
      case 'email':
        return const EmailActivityScreen();
      case 'packages':
        return PackagesScreen(initialStatus: f.isEmpty ? null : f);
      case 'payments':
        return PaymentsScreen(initialStatus: f.isEmpty ? null : f);

      // ── Team / reports ──
      case 'reports':
        return const ReportsScreen();
      case 'team':
        return const TeamScreen();
      case 'team_perf':
        return const TeamScreen(performance: true);
      case 'teams':
        return const TeamsManagementScreen();
      case 'attendance':
        return const AttendanceScreen();
      case 'escalations':
        return const EscalationsScreen();

      // ── Operations ──
      case 'ops_home':
        return const OperationsHomeScreen();
      case 'ops_bookings':
        return OpsBookingsScreen(initialStatus: f);
      case 'ops_tasks':
        return const OpsTasksScreen();
      case 'ops_vouchers':
        return OpsVouchersScreen(initialType: f.isEmpty ? 'all' : f);

      // ── Generic native API views (read-only lists / summaries) ──
      case 'ops_tracker':
        return GenericApiScreen(
          title: title ?? 'Trip Tracker',
          endpoint: '/operations-manager/trip-tracker',
          icon: Icons.map_outlined,
        );
      case 'ops_vendors':
        return GenericApiScreen(
          title: title ?? 'Vendors',
          endpoint: '/operations-manager/vendors',
          icon: Icons.business,
        );
      case 'ops_hotels':
        return GenericApiScreen(
          title: title ?? 'Hotels',
          endpoint: '/operations-manager/hotels',
          icon: Icons.hotel,
        );
      case 'ops_transport':
        return GenericApiScreen(
          title: title ?? 'Transport',
          endpoint: '/operations-manager/transport',
          icon: Icons.airport_shuttle,
        );
      case 'ops_activities':
        return GenericApiScreen(
          title: title ?? 'Activities',
          endpoint: '/operations-manager/activities',
          icon: Icons.explore_outlined,
        );
      case 'ops_support':
        return GenericApiScreen(
          title: title ?? 'Support',
          endpoint: '/operations-manager/tickets',
          icon: Icons.support_agent,
        );
      case 'lead_analytics':
        return GenericApiScreen(
          title: title ?? 'Lead Analytics',
          endpoint: '/leads/analytics/kpis',
          icon: Icons.analytics_outlined,
        );
      case 'lead_sla':
        return GenericApiScreen(
          title: title ?? 'SLA Monitor',
          endpoint: '/leads/analytics/sla',
          icon: Icons.timer_outlined,
        );
      case 'lead_audit':
        return GenericApiScreen(
          title: title ?? 'Audit Log',
          endpoint: '/leads/audit-log',
          icon: Icons.history,
        );
      case 'lead_recycle':
        return GenericApiScreen(
          title: title ?? 'Recycle Bin',
          endpoint: '/leads/recycle-bin',
          icon: Icons.delete_outline,
        );
      case 'dest_assignment':
        return GenericApiScreen(
          title: title ?? 'Destination Assignment',
          endpoint: '/destination-assignment/destinations',
          icon: Icons.place_outlined,
        );
      case 'skill_assignment':
        return GenericApiScreen(
          title: title ?? 'Skill Assignment',
          endpoint: '/skill-assignment/skills',
          icon: Icons.military_tech_outlined,
        );
      case 'settings_company':
        return GenericApiScreen(
          title: title ?? 'Company Settings',
          endpoint: '/company-settings',
          icon: Icons.business,
        );
      case 'settings_workspace':
        return GenericApiScreen(
          title: title ?? 'Workspace',
          endpoint: '/company-settings/onboarding',
          icon: Icons.domain,
        );
      case 'settings_subscription':
        return GenericApiScreen(
          title: title ?? 'Subscription',
          endpoint: '/company-settings/subscription',
          icon: Icons.workspace_premium_outlined,
        );
      case 'settings_email':
        return GenericApiScreen(
          title: title ?? 'Email Integration',
          endpoint: '/company/email/settings',
          icon: Icons.alternate_email,
        );
      case 'settings_email_templates':
        return GenericApiScreen(
          title: title ?? 'Email Templates',
          endpoint: '/email-templates',
          icon: Icons.mail_outline,
        );
      case 'settings_wa_templates':
        return GenericApiScreen(
          title: title ?? 'WhatsApp Templates',
          endpoint: '/whatsapp-templates',
          icon: Icons.chat,
        );
    }
    return _Page(
      title: title ?? 'Module',
      child: const EmptyState(message: 'This module is not available in the app yet', icon: Icons.construction),
    );
  }
}

/// Scaffold wrapper for body-only screens (tab content) opened from the menu.
class _Page extends StatelessWidget {
  const _Page({required this.title, required this.child});
  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: EmbTheme.cream,
      appBar: embAppBar(title),
      body: child,
    );
  }
}
