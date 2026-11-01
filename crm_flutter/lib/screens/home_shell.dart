import 'dart:async';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:provider/provider.dart';

import '../core/emb_theme.dart';
import '../providers/auth_provider.dart';
import '../providers/notification_hub.dart';
import '../services/followup_reminders.dart';
import '../services/followups_service.dart';
import 'dashboard_screen.dart';
import 'followups_screen.dart';
import 'leads_screen.dart';
import 'menu_screen.dart';
import 'notifications_screen.dart';
import 'operations_home_screen.dart';
import 'ops_bookings_screen.dart';
import 'ops_tasks_screen.dart';
import 'profile_screen.dart';
import 'quotes_screen.dart';

/// Tab navigation from menu / dashboard shortcuts.
abstract class HomeShellController {
  bool openInShell(String nativeId, {String? filter, String? title});
}

/// Native tab shell.
///  - Non-ops: Home | Leads | Quotes | Follow-ups | More | Me
///  - Ops:     Ops Home | Bookings | Tasks | More | Me
class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  static HomeShellController? controllerOf(BuildContext context) {
    final state = context.findAncestorStateOfType<State<HomeShell>>();
    if (state is HomeShellController) return state as HomeShellController;
    return null;
  }

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _Tab {
  const _Tab({
    required this.page,
    required this.active,
    required this.idle,
    required this.label,
    required this.title,
    this.appBar = true,
  });

  final Widget page;
  final IconData active;
  final IconData idle;
  final String label;
  final String title;

  /// Whether the shell should draw an AppBar (false when the page has its own).
  final bool appBar;
}

class _HomeShellState extends State<HomeShell> with WidgetsBindingObserver implements HomeShellController {
  int index = 0;
  String? _leadsFilter = 'all';
  String _quotesStatus = '';
  String _bookingsStatus = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    // After login: permission + follow-up sound alerts.
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (!mounted) return;
      await context.read<NotificationHub>().start();
      await _syncFollowUpReminders();
      // OEM battery savers kill background sockets — ask once after login.
      try {
        final st = await Permission.ignoreBatteryOptimizations.status;
        if (!st.isGranted) {
          await Permission.ignoreBatteryOptimizations.request();
        }
      } catch (_) {}
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (!mounted) return;
    final hub = context.read<NotificationHub>();
    if (state == AppLifecycleState.resumed) {
      unawaited(hub.onAppResumed());
    } else if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.inactive ||
        state == AppLifecycleState.hidden ||
        state == AppLifecycleState.detached) {
      unawaited(hub.onAppPaused());
    }
  }

  Future<void> _syncFollowUpReminders() async {
    if (!mounted) return;
    final role = context.read<AuthProvider>().user?.role;
    if (role == null || role == 'operations_manager') return;
    try {
      await FollowUpReminders.instance.syncAll(context.read<FollowupsService>(), role);
    } catch (_) {}
  }

  @override
  bool openInShell(String nativeId, {String? filter, String? title}) {
    final role = context.read<AuthProvider>().user?.role;
    final isOps = role == 'operations_manager';

    if (isOps) {
      switch (nativeId) {
        case 'home':
        case 'ops_home':
          setState(() => index = 0);
          return true;
        case 'ops_bookings':
          setState(() {
            _bookingsStatus = filter ?? '';
            index = 1;
          });
          return true;
        case 'ops_tasks':
          setState(() => index = 2);
          return true;
        case 'profile':
          setState(() => index = 4);
          return true;
        default:
          return false;
      }
    }

    switch (nativeId) {
      case 'home':
        setState(() => index = 0);
        return true;
      case 'leads':
        setState(() {
          _leadsFilter = (filter == null || filter.isEmpty) ? 'all' : filter;
          index = 1;
        });
        return true;
      case 'quotes':
        setState(() {
          _quotesStatus = filter ?? '';
          index = 2;
        });
        return true;
      case 'followups':
        setState(() => index = 3);
        return true;
      case 'profile':
        setState(() => index = 5);
        return true;
      default:
        return false;
    }
  }

  List<_Tab> _tabs(bool isOps) {
    if (isOps) {
      return [
        const _Tab(
          page: OperationsHomeScreen(embedded: true),
          active: Icons.dashboard_customize_rounded,
          idle: Icons.dashboard_customize_outlined,
          label: 'Ops Home',
          title: 'Operations',
        ),
        _Tab(
          page: OpsBookingsScreen(
            key: ValueKey('bookings-$_bookingsStatus'),
            initialStatus: _bookingsStatus,
          ),
          active: Icons.flight_takeoff_rounded,
          idle: Icons.flight_takeoff_outlined,
          label: 'Bookings',
          title: 'Bookings',
          appBar: false,
        ),
        const _Tab(
          page: OpsTasksScreen(),
          active: Icons.checklist_rounded,
          idle: Icons.checklist_outlined,
          label: 'Tasks',
          title: 'Tasks',
          appBar: false,
        ),
        const _Tab(
          page: MenuScreen(),
          active: Icons.grid_view_rounded,
          idle: Icons.grid_view_outlined,
          label: 'More',
          title: 'All Modules',
        ),
        const _Tab(
          page: ProfileScreen(),
          active: Icons.person_rounded,
          idle: Icons.person_outline_rounded,
          label: 'Me',
          title: 'Profile',
        ),
      ];
    }
    return [
      const _Tab(
        page: DashboardScreen(),
        active: Icons.home_rounded,
        idle: Icons.home_outlined,
        label: 'Home',
        title: 'Home',
        appBar: false,
      ),
      _Tab(
        page: LeadsScreen(
          key: ValueKey('leads-$_leadsFilter'),
          initialFilter: _leadsFilter,
        ),
        active: Icons.people_alt_rounded,
        idle: Icons.people_outline_rounded,
        label: 'Leads',
        title: 'Leads',
        appBar: false,
      ),
      _Tab(
        page: QuotesScreen(
          key: ValueKey('quotes-$_quotesStatus'),
          initialStatus: _quotesStatus,
        ),
        active: Icons.description_rounded,
        idle: Icons.description_outlined,
        label: 'Quotes',
        title: 'Quotes',
      ),
      const _Tab(
        page: FollowupsScreen(),
        active: Icons.event_available_rounded,
        idle: Icons.event_available_outlined,
        label: 'Follow-ups',
        title: 'Follow-ups',
      ),
      const _Tab(
        page: MenuScreen(),
        active: Icons.grid_view_rounded,
        idle: Icons.grid_view_outlined,
        label: 'More',
        title: 'All Modules',
      ),
      const _Tab(
        page: ProfileScreen(),
        active: Icons.person_rounded,
        idle: Icons.person_outline_rounded,
        label: 'Me',
        title: 'Profile',
      ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final role = context.watch<AuthProvider>().user?.role;
    final isOps = role == 'operations_manager';
    final tabs = _tabs(isOps);
    if (index >= tabs.length) index = 0;
    final current = tabs[index];

    return Scaffold(
      backgroundColor: EmbTheme.cream,
      extendBody: true,
      appBar: current.appBar
          ? AppBar(
              backgroundColor: EmbTheme.white,
              title: Text(current.title),
              actions: [
                Consumer<NotificationHub>(
                  builder: (context, hub, _) {
                    return IconButton(
                      tooltip: 'Notifications',
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(builder: (_) => const NotificationsScreen()),
                        );
                      },
                      icon: Badge(
                        isLabelVisible: hub.unreadCount > 0,
                        label: Text(
                          hub.unreadCount > 99 ? '99+' : '${hub.unreadCount}',
                          style: const TextStyle(fontSize: 10),
                        ),
                        child: const Icon(Icons.notifications_outlined),
                      ),
                    );
                  },
                ),
              ],
            )
          : null,
      body: IndexedStack(index: index, children: [for (final t in tabs) t.page]),
      bottomNavigationBar: SafeArea(
        minimum: const EdgeInsets.fromLTRB(12, 0, 12, 10),
        child: Align(
          alignment: Alignment.bottomCenter,
          heightFactor: 1,
          child: Material(
            color: Colors.transparent,
            child: Container(
              height: 68,
              padding: const EdgeInsets.symmetric(horizontal: 6),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(999),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.08),
                    blurRadius: 24,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Row(
                children: List.generate(tabs.length, (i) {
                  final selected = index == i;
                  final tab = tabs[i];
                  final color = selected ? EmbTheme.saffron : const Color(0xFF9CA3AF);
                  return Expanded(
                    child: InkWell(
                      borderRadius: BorderRadius.circular(999),
                      onTap: () => setState(() => index = i),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(selected ? tab.active : tab.idle, color: color, size: 22),
                          const SizedBox(height: 3),
                          Text(
                            tab.label,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.plusJakartaSans(
                              color: color,
                              fontSize: 10.5,
                              fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
