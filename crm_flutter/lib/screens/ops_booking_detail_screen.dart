import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../core/api_client.dart';
import '../core/emb_theme.dart';
import '../models/models.dart';
import '../services/operations_service.dart';
import '../widgets/common_widgets.dart' show formatMoney, formatDate;
import '../widgets/emb_widgets.dart';
import 'ops_booking_vouchers_screen.dart';
import 'ops_tasks_screen.dart';

class OpsBookingDetailScreen extends StatefulWidget {
  const OpsBookingDetailScreen({super.key, required this.bookingId});
  final String bookingId;

  @override
  State<OpsBookingDetailScreen> createState() => _OpsBookingDetailScreenState();
}

class _OpsBookingDetailScreenState extends State<OpsBookingDetailScreen> {
  bool loading = true;
  bool _busyHotel = false;
  bool _busyCab = false;
  String? error;
  OpsBooking? booking;

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
      final b = await context.read<OperationsService>().fetchOpsBooking(widget.bookingId);
      if (!mounted) return;
      setState(() {
        booking = b;
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

  Future<void> _call(String? phone) async {
    final p = (phone ?? '').trim();
    if (p.isEmpty) return;
    await launchUrl(Uri.parse('tel:$p'));
  }

  Future<void> _whatsApp(String? phone) async {
    final digits = (phone ?? '').replaceAll(RegExp(r'\D'), '');
    if (digits.isEmpty) {
      embSnack(context, 'Phone number missing', error: true);
      return;
    }
    final withCountry = digits.length == 10 ? '91$digits' : digits;
    await launchUrl(Uri.parse('https://wa.me/$withCountry'), mode: LaunchMode.externalApplication);
  }

  bool _isPending(String? status) {
    final s = (status ?? '').toLowerCase().trim();
    return s.isEmpty || s == 'pending' || s == 'requested' || s == 'new';
  }

  Future<void> _confirmHotel() async {
    setState(() => _busyHotel = true);
    try {
      final b = await context.read<OperationsService>().confirmHotel(widget.bookingId);
      if (!mounted) return;
      setState(() => booking = b);
      embSnack(context, 'Hotel confirmed');
    } catch (e) {
      if (mounted) embSnack(context, apiErrorMessage(e), error: true);
    } finally {
      if (mounted) setState(() => _busyHotel = false);
    }
  }

  Future<void> _confirmCab() async {
    setState(() => _busyCab = true);
    try {
      final b = await context.read<OperationsService>().confirmCab(widget.bookingId);
      if (!mounted) return;
      setState(() => booking = b);
      embSnack(context, 'Cab confirmed');
    } catch (e) {
      if (mounted) embSnack(context, apiErrorMessage(e), error: true);
    } finally {
      if (mounted) setState(() => _busyCab = false);
    }
  }

  Future<void> _editHotelName(int index) async {
    final current = booking;
    if (current == null || index < 0 || index >= current.hotels.length) return;
    final hotel = current.hotels[index];
    final controller = TextEditingController(
      text: (hotel['hotelName'] ?? hotel['name'] ?? '').toString(),
    );
    final name = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Change hotel name'),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: const InputDecoration(
            labelText: 'Hotel name',
            border: OutlineInputBorder(),
          ),
          textCapitalization: TextCapitalization.words,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, controller.text.trim()),
            child: const Text('Save'),
          ),
        ],
      ),
    );
    controller.dispose();
    if (name == null || name.isEmpty || !mounted) return;
    try {
      final b = await context.read<OperationsService>().renameHotel(
        widget.bookingId,
        name,
        index: index,
      );
      if (!mounted) return;
      setState(() => booking = b);
      embSnack(context, 'Hotel name updated');
    } catch (e) {
      if (mounted) embSnack(context, apiErrorMessage(e), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final b = booking;
    return Scaffold(
      backgroundColor: EmbTheme.cream,
      appBar: embAppBar(b?.bookingNumber ?? 'Booking'),
      body: loading
          ? const EmbLoading()
          : error != null || b == null
              ? EmbErrorView(message: error ?? 'Not found', onRetry: _load)
              : RefreshIndicator(
                  color: EmbTheme.teal,
                  onRefresh: _load,
                  child: ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 40),
                    children: [
                      EmbCard(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(b.customerName ?? 'Guest',
                                      style: embBody(size: 20, weight: FontWeight.w800)),
                                ),
                                EmbPill(prettyStatus(b.status), color: statusTone(b.status)),
                              ],
                            ),
                            const SizedBox(height: 8),
                            if ((b.customerPhone ?? '').trim().isNotEmpty)
                              Row(
                                children: [
                                  const Icon(Icons.phone_outlined, size: 16, color: EmbTheme.muted),
                                  const SizedBox(width: 6),
                                  Expanded(child: Text(b.customerPhone!, style: embBody())),
                                  IconButton(
                                    tooltip: 'Call',
                                    icon: const Icon(Icons.call, color: EmbTheme.mint),
                                    onPressed: () => _call(b.customerPhone),
                                  ),
                                  IconButton(
                                    tooltip: 'WhatsApp',
                                    icon: const Icon(Icons.chat, color: Color(0xFF25D366)),
                                    onPressed: () => _whatsApp(b.customerPhone),
                                  ),
                                ],
                              ),
                            _row('Package', b.packageName ?? '—'),
                            _row('Destination', b.destination ?? '—'),
                            _row('Travel date', formatDate(b.travelDate)),
                            _row('Return date', formatDate(b.returnDate)),
                            _row('Guests', '${b.adults} adults, ${b.children} children'),
                          ],
                        ),
                      ),
                      const EmbSectionTitle('Quick actions'),
                      EmbCard(
                        child: Column(
                          children: [
                            _actionTile(
                              icon: Icons.confirmation_number_outlined,
                              label: 'Vouchers',
                              subtitle: 'Create · Preview · Send (CRM jaisa)',
                              onTap: () => Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => OpsBookingVouchersScreen(bookingId: b.id),
                                ),
                              ),
                            ),
                            const Divider(height: 1),
                            _actionTile(
                              icon: Icons.checklist,
                              label: 'Open tasks',
                              subtitle: 'Operations to-do for this trip',
                              onTap: () => Navigator.of(context).push(
                                MaterialPageRoute(builder: (_) => const OpsTasksScreen()),
                              ),
                            ),
                            if ((b.customerPhone ?? '').trim().isNotEmpty) ...[
                              const Divider(height: 1),
                              _actionTile(
                                icon: Icons.call,
                                label: 'Call customer',
                                subtitle: b.customerPhone!,
                                onTap: () => _call(b.customerPhone),
                              ),
                              const Divider(height: 1),
                              _actionTile(
                                icon: Icons.chat,
                                label: 'WhatsApp customer',
                                subtitle: b.customerPhone!,
                                onTap: () => _whatsApp(b.customerPhone),
                              ),
                            ],
                          ],
                        ),
                      ),
                      const EmbSectionTitle('Payment'),
                      EmbCard(
                        child: Column(
                          children: [
                            _row('Total', formatMoney(b.totalAmount)),
                            _row('Advance received', formatMoney(b.advanceReceived)),
                            _row('Balance', formatMoney(b.remainingBalance)),
                          ],
                        ),
                      ),
                      const EmbSectionTitle('Confirmations'),
                      EmbCard(
                        child: Column(
                          children: [
                            _confirmRow(
                              label: 'Hotel',
                              status: b.hotelConfirmation ?? 'Pending',
                              busy: _busyHotel,
                              canConfirm: _isPending(b.hotelConfirmation),
                              onConfirm: _confirmHotel,
                            ),
                            const Divider(height: 18),
                            _confirmRow(
                              label: 'Cab',
                              status: b.cabConfirmation ?? 'Pending',
                              busy: _busyCab,
                              canConfirm: _isPending(b.cabConfirmation),
                              onConfirm: _confirmCab,
                            ),
                          ],
                        ),
                      ),
                      if (b.hotels.isNotEmpty) ...[
                        const EmbSectionTitle('Hotels'),
                        for (var i = 0; i < b.hotels.length; i++)
                          EmbCard(
                            child: Row(
                              children: [
                                const Icon(Icons.hotel, color: EmbTheme.teal),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    '${b.hotels[i]['hotelName'] ?? b.hotels[i]['name'] ?? 'Hotel'}'
                                    '${b.hotels[i]['roomType'] != null ? ' • ${b.hotels[i]['roomType']}' : ''}',
                                    style: embBody(weight: FontWeight.w600),
                                  ),
                                ),
                                IconButton(
                                  tooltip: 'Change hotel name',
                                  icon: const Icon(Icons.edit_outlined, size: 20, color: EmbTheme.teal),
                                  onPressed: () => _editHotelName(i),
                                ),
                                EmbPill(
                                  prettyStatus((b.hotels[i]['status'] ?? b.hotelConfirmation ?? 'pending').toString()),
                                  color: statusTone((b.hotels[i]['status'] ?? b.hotelConfirmation)?.toString()),
                                ),
                              ],
                            ),
                          ),
                      ],
                      if (b.transport.isNotEmpty) ...[
                        const EmbSectionTitle('Transport'),
                        for (final t in b.transport)
                          EmbCard(
                            child: Row(
                              children: [
                                const Icon(Icons.directions_car, color: EmbTheme.sky),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    '${t['vehicleType'] ?? 'Vehicle'}'
                                    '${t['driverName'] != null ? ' • ${t['driverName']}' : ''}'
                                    '\n${t['pickupLocation'] ?? ''} → ${t['dropLocation'] ?? ''}',
                                    style: embBody(size: 13),
                                  ),
                                ),
                                EmbPill(
                                  prettyStatus((t['status'] ?? b.cabConfirmation ?? 'pending').toString()),
                                  color: statusTone((t['status'] ?? b.cabConfirmation)?.toString()),
                                ),
                              ],
                            ),
                          ),
                      ],
                      if (b.tasks.isNotEmpty) ...[
                        const EmbSectionTitle('Tasks'),
                        for (final t in b.tasks)
                          EmbCard(
                            onTap: () => Navigator.of(context).push(
                              MaterialPageRoute(builder: (_) => const OpsTasksScreen()),
                            ),
                            child: Row(
                              children: [
                                Expanded(child: Text(t.title, style: embBody(weight: FontWeight.w600))),
                                EmbPill(prettyStatus(t.status), color: statusTone(t.status)),
                                const SizedBox(width: 4),
                                const Icon(Icons.chevron_right, color: EmbTheme.muted, size: 18),
                              ],
                            ),
                          ),
                      ],
                    ],
                  ),
                ),
    );
  }

  Widget _actionTile({
    required IconData icon,
    required String label,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(color: EmbTheme.tealSoft, borderRadius: BorderRadius.circular(12)),
              child: Icon(icon, color: EmbTheme.teal, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: embBody(size: 15, weight: FontWeight.w700)),
                  Text(subtitle, style: embBody(size: 12, color: EmbTheme.inkSoft)),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: EmbTheme.muted),
          ],
        ),
      ),
    );
  }

  Widget _confirmRow({
    required String label,
    required String status,
    required bool busy,
    required bool canConfirm,
    required VoidCallback onConfirm,
  }) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: embBody(size: 14, weight: FontWeight.w700)),
              const SizedBox(height: 4),
              EmbPill(prettyStatus(status), color: statusTone(status)),
            ],
          ),
        ),
        if (canConfirm)
          TextButton(
            onPressed: busy ? null : onConfirm,
            child: busy
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2, color: EmbTheme.teal),
                  )
                : Text('Confirm $label', style: embBody(size: 13, weight: FontWeight.w700, color: EmbTheme.teal)),
          )
        else
          Text('Done', style: embBody(size: 12, color: EmbTheme.mint, weight: FontWeight.w700)),
      ],
    );
  }

  Widget _row(String k, String v) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(width: 120, child: Text(k, style: embBody(size: 13, color: EmbTheme.muted))),
            Expanded(child: Text(v, style: embBody(size: 14, weight: FontWeight.w600))),
          ],
        ),
      );
}
