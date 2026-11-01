import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../core/emb_theme.dart';
import '../models/models.dart';
import '../services/operations_service.dart';
import '../widgets/common_widgets.dart' show formatMoney, formatDate;
import '../widgets/emb_widgets.dart';
import 'ops_booking_detail_screen.dart';
import 'ops_bookings_screen.dart';
import 'ops_tasks_screen.dart';
import 'ops_vouchers_screen.dart';

/// Operations manager home: KPIs + links to bookings / tasks / vouchers.
class OperationsHomeScreen extends StatefulWidget {
  const OperationsHomeScreen({super.key, this.embedded = false});

  /// When true, no AppBar is shown (used inside a tab shell).
  final bool embedded;

  @override
  State<OperationsHomeScreen> createState() => _OperationsHomeScreenState();
}

class _OperationsHomeScreenState extends State<OperationsHomeScreen> {
  bool loading = true;
  String? error;
  OpsDashboard? data;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      loading = true;
      error = null;
    });
    try {
      final d = await context.read<OperationsService>().fetchOpsDashboard();
      if (!mounted) return;
      setState(() {
        data = d;
        loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        error = apiErrorMessage(e);
        loading = false;
      });
    }
  }

  void _push(Widget w) => Navigator.of(context).push(MaterialPageRoute(builder: (_) => w));

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: EmbTheme.cream,
      appBar: widget.embedded ? null : embAppBar('Operations'),
      body: loading
          ? const EmbLoading()
          : error != null
              ? EmbErrorView(message: error!, onRetry: _load)
              : RefreshIndicator(
                  color: EmbTheme.teal,
                  onRefresh: _load,
                  child: _content(data ?? OpsDashboard.empty()),
                ),
    );
  }

  Widget _content(OpsDashboard d) {
    num k(String key) => d.kpis[key] ?? 0;
    final tiles = <(String, num, IconData, Color, VoidCallback?)>[
      (
        'Arrivals today',
        k('todaysArrivals'),
        Icons.flight_land,
        EmbTheme.teal,
        () => _push(const OpsBookingsScreen(initialStatus: 'active')),
      ),
      (
        'Departures today',
        k('todaysDepartures'),
        Icons.flight_takeoff,
        EmbTheme.sky,
        () => _push(const OpsBookingsScreen(initialStatus: 'completed')),
      ),
      (
        'Pending bookings',
        k('pendingBookings'),
        Icons.schedule,
        EmbTheme.saffron,
        () => _push(const OpsBookingsScreen(initialStatus: 'pending')),
      ),
      (
        'Active trips',
        k('activeTrips'),
        Icons.navigation_outlined,
        EmbTheme.mint,
        () => _push(const OpsBookingsScreen(initialStatus: 'active')),
      ),
      (
        'Pending tasks',
        k('pendingTasks'),
        Icons.checklist,
        EmbTheme.coral,
        () => _push(const OpsTasksScreen()),
      ),
      (
        'Voucher pending',
        k('voucherPending'),
        Icons.confirmation_number_outlined,
        EmbTheme.sky,
        () => _push(const OpsVouchersScreen()),
      ),
      (
        'Hotel pending',
        k('hotelPending'),
        Icons.hotel,
        EmbTheme.saffron,
        () => _push(const OpsBookingsScreen(initialStatus: 'pending')),
      ),
      (
        'Cab pending',
        k('cabPending'),
        Icons.local_taxi,
        EmbTheme.teal,
        () => _push(const OpsBookingsScreen(initialStatus: 'pending')),
      ),
    ];

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 110),
      children: [
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 10,
          crossAxisSpacing: 10,
          childAspectRatio: 1.7,
          children: [
            for (final t in tiles)
              InkWell(
                borderRadius: BorderRadius.circular(16),
                onTap: t.$5,
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: EmbTheme.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: EmbTheme.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Icon(t.$3, color: t.$4, size: 20),
                      Text(t.$2.toInt().toString(),
                          style: embBody(size: 24, weight: FontWeight.w800)),
                      Text(t.$1, style: embBody(size: 12, color: EmbTheme.inkSoft)),
                    ],
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 10),
        EmbCard(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _stat('Total', k('totalBookings').toInt().toString()),
              _stat('Confirmed', k('confirmedBookings').toInt().toString()),
              _stat('Revenue', formatMoney(k('totalRevenue'))),
            ],
          ),
        ),
        const EmbSectionTitle('Manage'),
        _navTile(Icons.flight_takeoff, 'Bookings', 'Pending, confirmed, active, completed',
            () => _push(const OpsBookingsScreen())),
        _navTile(Icons.checklist, 'Tasks', 'Operations to-do list', () => _push(const OpsTasksScreen())),
        _navTile(Icons.confirmation_number_outlined, 'Vouchers', 'Hotel, cab, activity, flight',
            () => _push(const OpsVouchersScreen())),
        if (d.alerts.isNotEmpty) ...[
          const EmbSectionTitle('Alerts'),
          for (final a in d.alerts)
            EmbCard(
              onTap: () => _push(const OpsBookingsScreen(initialStatus: 'pending')),
              child: Row(
                children: [
                  const Icon(Icons.notification_important_outlined, color: EmbTheme.saffron),
                  const SizedBox(width: 10),
                  Expanded(child: Text(a.title, style: embBody(weight: FontWeight.w600))),
                  if (a.timeAgo != null) Text(a.timeAgo!, style: embBody(size: 11, color: EmbTheme.muted)),
                  const Icon(Icons.chevron_right, color: EmbTheme.muted, size: 18),
                ],
              ),
            ),
        ],
        if (d.newBookings.isNotEmpty) ...[
          const EmbSectionTitle('New bookings'),
          for (final b in d.newBookings.take(5)) _bookingTile(b),
        ],
        if (d.upcomingTrips.isNotEmpty) ...[
          const EmbSectionTitle('Upcoming trips'),
          for (final b in d.upcomingTrips.take(5)) _bookingTile(b),
        ],
      ],
    );
  }

  Widget _stat(String label, String value) => Column(
        children: [
          Text(value, style: embBody(size: 16, weight: FontWeight.w800)),
          Text(label, style: embBody(size: 11, color: EmbTheme.muted)),
        ],
      );

  Widget _navTile(IconData icon, String title, String sub, VoidCallback onTap) => EmbCard(
        onTap: onTap,
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: EmbTheme.tealSoft, borderRadius: BorderRadius.circular(12)),
              child: Icon(icon, color: EmbTheme.teal),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: embBody(size: 15, weight: FontWeight.w700)),
                  Text(sub, style: embBody(size: 12, color: EmbTheme.inkSoft)),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: EmbTheme.muted),
          ],
        ),
      );

  Widget _bookingTile(OpsBooking b) => EmbCard(
        onTap: () {
          final id = b.id.trim();
          if (id.isEmpty) {
            embSnack(context, 'Booking id missing — pull to refresh', error: true);
            return;
          }
          _push(OpsBookingDetailScreen(bookingId: id));
        },
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(b.customerName ?? b.bookingNumber ?? 'Booking',
                      style: embBody(size: 15, weight: FontWeight.w700)),
                  Text('${b.destination ?? b.packageName ?? '—'} • ${formatDate(b.travelDate)}',
                      style: embBody(size: 12, color: EmbTheme.inkSoft)),
                ],
              ),
            ),
            EmbPill(prettyStatus(b.status), color: statusTone(b.status)),
          ],
        ),
      );
}
