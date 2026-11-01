import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../core/emb_theme.dart';
import '../models/models.dart';
import '../services/operations_service.dart';
import '../services/whatsapp_pdf_share.dart';
import '../widgets/common_widgets.dart' show formatDate;
import '../widgets/emb_widgets.dart';
import 'voucher_edit_screen.dart';
import 'voucher_preview_screen.dart';

/// CRM-style voucher center for one booking: generate / preview / send (native, no CRM redirect).
class OpsBookingVouchersScreen extends StatefulWidget {
  const OpsBookingVouchersScreen({super.key, required this.bookingId});
  final String bookingId;

  @override
  State<OpsBookingVouchersScreen> createState() => _OpsBookingVouchersScreenState();
}

class _OpsBookingVouchersScreenState extends State<OpsBookingVouchersScreen> {
  bool loading = true;
  String? error;
  OpsBookingExecution? execution;
  String? busyKey;

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
      final data = await context.read<OperationsService>().fetchBookingExecution(widget.bookingId);
      if (!mounted) return;
      setState(() {
        execution = data;
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

  OpsVoucher? _pick(String type, int index) {
    final list = execution?.activeVouchers ?? const <OpsVoucher>[];
    final normalized = type == 'cab' ? 'transport' : type;
    final matches = list.where((v) {
      final t = (v.type ?? '').toLowerCase();
      final vt = t == 'cab' ? 'transport' : t;
      return vt == normalized && v.assignmentIndex == index && v.isActive;
    }).toList()
      ..sort((a, b) => b.version.compareTo(a.version));
    return matches.isEmpty ? null : matches.first;
  }

  List<_VoucherSlot> _slots() {
    final booking = execution?.booking;
    if (booking == null) return const [];
    final hotels = booking.hotels
        .where((h) => '${h['hotelName'] ?? h['name'] ?? ''}'.trim().isNotEmpty)
        .toList();
    final slots = <_VoucherSlot>[];

    for (var i = 0; i < hotels.length; i++) {
      final h = hotels[i];
      final originalIndex = booking.hotels.indexOf(h);
      final idx = originalIndex >= 0 ? originalIndex : i;
      slots.add(_VoucherSlot(
        type: 'hotel',
        assignmentIndex: idx,
        label: hotels.length > 1 ? 'Hotel ${i + 1}' : 'Hotel voucher',
        subtitle: '${h['hotelName'] ?? h['name'] ?? 'Hotel'}'
            '${h['roomType'] != null ? ' · ${h['roomType']}' : ''}',
        icon: Icons.hotel,
        color: EmbTheme.teal,
        voucher: _pick('hotel', idx),
      ));
    }

    slots.add(_VoucherSlot(
      type: 'transport',
      assignmentIndex: 0,
      label: 'Cab itinerary voucher',
      subtitle: booking.transport.isNotEmpty
          ? '${booking.transport.first['vehicleType'] ?? 'Cab'}'
              '${booking.transport.first['driverName'] != null ? ' · ${booking.transport.first['driverName']}' : ''}'
          : 'Day-wise cab itinerary',
      icon: Icons.directions_car,
      color: EmbTheme.sky,
      voucher: _pick('transport', 0),
    ));

    slots.add(_VoucherSlot(
      type: 'client',
      assignmentIndex: 0,
      label: 'Client full voucher',
      subtitle: booking.packageName ?? booking.customerName ?? 'Guest travel voucher',
      icon: Icons.description_outlined,
      color: EmbTheme.mint,
      voucher: _pick('client', 0),
    ));

    return slots;
  }

  Future<void> _generateAll() async {
    setState(() => busyKey = 'all');
    try {
      await context.read<OperationsService>().generateAllVouchers(widget.bookingId);
      if (!mounted) return;
      embSnack(context, 'All vouchers generated');
      await _load();
    } catch (e) {
      if (mounted) embSnack(context, apiErrorMessage(e), error: true);
    } finally {
      if (mounted) setState(() => busyKey = null);
    }
  }

  Future<void> _generate(_VoucherSlot slot) async {
    final key = '${slot.type}:${slot.assignmentIndex}';
    setState(() => busyKey = key);
    try {
      final v = await context.read<OperationsService>().generateVoucher(
            widget.bookingId,
            type: slot.type,
            assignmentIndex: slot.assignmentIndex,
          );
      if (!mounted) return;
      embSnack(context, 'Voucher created ${v.voucherNumber ?? ''}');
      await _load();
    } catch (e) {
      if (mounted) embSnack(context, apiErrorMessage(e), error: true);
    } finally {
      if (mounted) setState(() => busyKey = null);
    }
  }

  Future<void> _regenerate(OpsVoucher v) async {
    setState(() => busyKey = 'regen-${v.id}');
    try {
      await context.read<OperationsService>().regenerateVoucher(v.id);
      if (!mounted) return;
      embSnack(context, 'Voucher regenerated');
      await _load();
    } catch (e) {
      if (mounted) embSnack(context, apiErrorMessage(e), error: true);
    } finally {
      if (mounted) setState(() => busyKey = null);
    }
  }

  Future<void> _preview(OpsVoucher v) async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => VoucherPreviewScreen(
          voucherId: v.id,
          title: v.voucherNumber ?? v.title,
        ),
      ),
    );
  }

  Future<void> _edit(OpsVoucher v) async {
    final updated = await Navigator.of(context).push<OpsVoucher>(
      MaterialPageRoute(
        builder: (_) => VoucherEditScreen(
          voucher: v,
          booking: execution?.booking,
        ),
      ),
    );
    if (!mounted) return;
    if (updated != null) {
      await _load();
      await _preview(updated);
    }
  }

  Future<void> _sendWhatsApp(OpsVoucher v) async {
    setState(() => busyKey = 'wa-${v.id}');
    try {
      final phone = v.customerPhone ?? execution?.booking.customerPhone;
      final data = await context.read<OperationsService>().sendVoucherWhatsApp(
            v.id,
            phone: phone,
          );
      if (!mounted) return;
      final ok = await openWhatsAppWithPdf(
        waMeUrl: data['waMeUrl']?.toString(),
        pdfBase64: data['pdfBase64']?.toString(),
        fileName: data['fileName']?.toString() ?? 'voucher.pdf',
        message: data['message']?.toString(),
        phone: data['phone']?.toString() ?? phone,
      );
      if (!mounted) return;
      embSnack(
        context,
        ok ? 'WhatsApp ready — PDF attach / send karein' : 'Could not open WhatsApp',
        error: !ok,
      );
      if (ok) await _load();
    } catch (e) {
      if (mounted) embSnack(context, apiErrorMessage(e), error: true);
    } finally {
      if (mounted) setState(() => busyKey = null);
    }
  }

  Future<void> _sendEmail(OpsVoucher v) async {
    final initial = v.customerEmail ?? execution?.booking.customerEmail ?? '';
    final to = await showDialog<String>(
      context: context,
      builder: (ctx) {
        final ctrl = TextEditingController(text: initial);
        return AlertDialog(
          title: Text('Send voucher email', style: embBody(size: 18, weight: FontWeight.w800)),
          content: TextField(
            controller: ctrl,
            keyboardType: TextInputType.emailAddress,
            decoration: embInput('Email address', icon: Icons.mail_outline),
            autofocus: true,
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            FilledButton(onPressed: () => Navigator.pop(ctx, ctrl.text.trim()), child: const Text('Send')),
          ],
        );
      },
    );
    if (to == null || to.isEmpty || !mounted) return;
    setState(() => busyKey = 'email-${v.id}');
    try {
      await context.read<OperationsService>().sendVoucherEmail(v.id, to: to);
      if (!mounted) return;
      embSnack(context, 'Voucher emailed to $to');
      await _load();
    } catch (e) {
      if (mounted) embSnack(context, apiErrorMessage(e), error: true);
    } finally {
      if (mounted) setState(() => busyKey = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final booking = execution?.booking;
    final slots = _slots();
    final title = booking?.bookingNumber?.isNotEmpty == true
        ? 'Vouchers · ${booking!.bookingNumber}'
        : 'Booking vouchers';

    return Scaffold(
      backgroundColor: EmbTheme.cream,
      appBar: embAppBar(title, actions: [
        IconButton(icon: const Icon(Icons.refresh), onPressed: busyKey != null ? null : _load),
      ]),
      body: loading
          ? const EmbLoading()
          : error != null
              ? EmbErrorView(message: error!, onRetry: _load)
              : RefreshIndicator(
                  color: EmbTheme.teal,
                  onRefresh: _load,
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 40),
                    children: [
                      if (booking != null)
                        EmbCard(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(booking.customerName ?? 'Guest',
                                        style: embBody(size: 18, weight: FontWeight.w800)),
                                  ),
                                  EmbPill(
                                    prettyStatus(execution?.voucherStatus ?? booking.voucherStatus ?? 'pending'),
                                    color: statusTone(execution?.voucherStatus ?? booking.voucherStatus),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                [
                                  if ((booking.destination ?? '').isNotEmpty) booking.destination!,
                                  if ((booking.travelDate ?? '').isNotEmpty) formatDate(booking.travelDate),
                                  if ((booking.customerPhone ?? '').isNotEmpty) booking.customerPhone!,
                                ].join(' · '),
                                style: embBody(size: 13, color: EmbTheme.inkSoft),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Create → Preview → WhatsApp/Email. Sent / Not sent yahi dikhega. CRM redirect nahi.',
                                style: embBody(size: 12, color: EmbTheme.muted),
                              ),
                            ],
                          ),
                        ),
                      const SizedBox(height: 10),
                      FilledButton.icon(
                        style: FilledButton.styleFrom(
                          backgroundColor: EmbTheme.teal,
                          foregroundColor: Colors.white,
                          minimumSize: const Size.fromHeight(48),
                        ),
                        onPressed: busyKey != null ? null : _generateAll,
                        icon: busyKey == 'all'
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : const Icon(Icons.auto_awesome),
                        label: Text(busyKey == 'all' ? 'Generating…' : 'Generate all vouchers'),
                      ),
                      const EmbSectionTitle('Voucher slots'),
                      for (final slot in slots) _slotCard(slot),
                    ],
                  ),
                ),
    );
  }

  Widget _slotCard(_VoucherSlot slot) {
    final v = slot.voucher;
    final genBusy = busyKey == '${slot.type}:${slot.assignmentIndex}';
    final regenBusy = v != null && busyKey == 'regen-${v.id}';
    final waBusy = v != null && busyKey == 'wa-${v.id}';
    final emailBusy = v != null && busyKey == 'email-${v.id}';

    return EmbCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: slot.color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(slot.icon, color: slot.color),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(slot.label, style: embBody(size: 15, weight: FontWeight.w800)),
                    Text(slot.subtitle, style: embBody(size: 12, color: EmbTheme.inkSoft)),
                    if (v != null)
                      Text(
                        v.voucherNumber ?? 'Issued',
                        style: embBody(size: 11, color: EmbTheme.muted),
                      ),
                  ],
                ),
              ),
              EmbPill(
                v == null ? 'Not created' : prettyStatus(v.status ?? 'issued'),
                color: v == null ? EmbTheme.saffron : statusTone(v.status),
              ),
            ],
          ),
          if (v != null) ...[
            const SizedBox(height: 10),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                _sentChip(
                  label: v.whatsappSent ? 'WhatsApp sent' : 'WhatsApp not sent',
                  ok: v.whatsappSent,
                  icon: Icons.chat,
                ),
                _sentChip(
                  label: v.emailSent ? 'Email sent' : 'Email not sent',
                  ok: v.emailSent,
                  icon: Icons.mail_outline,
                ),
                if ((v.sentAt ?? '').isNotEmpty)
                  _sentChip(label: 'Sent ${formatDate(v.sentAt)}', ok: true, icon: Icons.check_circle_outline),
              ],
            ),
          ],
          const SizedBox(height: 12),
          if (v == null)
            FilledButton.icon(
              style: FilledButton.styleFrom(backgroundColor: EmbTheme.teal, foregroundColor: Colors.white),
              onPressed: busyKey != null ? null : () => _generate(slot),
              icon: genBusy
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.add),
              label: Text(genBusy ? 'Creating…' : 'Create voucher'),
            )
          else
            Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: busyKey != null ? null : () => _preview(v),
                        icon: const Icon(Icons.visibility_outlined, size: 18),
                        label: const Text('Preview'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: busyKey != null ? null : () => _edit(v),
                        icon: const Icon(Icons.edit_outlined, size: 18),
                        label: const Text('Edit'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: busyKey != null ? null : () => _regenerate(v),
                        icon: regenBusy
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Icon(Icons.refresh, size: 18),
                        label: Text(regenBusy ? '…' : 'Regenerate'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: busyKey != null ? null : () => _sendWhatsApp(v),
                        icon: waBusy
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Icon(Icons.chat, size: 18, color: Color(0xFF25D366)),
                        label: Text(waBusy ? 'Preparing…' : 'WhatsApp'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: busyKey != null ? null : () => _sendEmail(v),
                    icon: emailBusy
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.mail_outline, size: 18, color: EmbTheme.sky),
                    label: Text(emailBusy ? 'Sending…' : 'Email'),
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }

  Widget _sentChip({required String label, required bool ok, required IconData icon}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: ok ? EmbTheme.mint.withValues(alpha: 0.15) : EmbTheme.saffron.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: ok ? EmbTheme.mint : EmbTheme.saffron),
          const SizedBox(width: 6),
          Text(
            label,
            style: embBody(
              size: 11,
              weight: FontWeight.w700,
              color: ok ? EmbTheme.mint : EmbTheme.saffron,
            ),
          ),
        ],
      ),
    );
  }
}

class _VoucherSlot {
  _VoucherSlot({
    required this.type,
    required this.assignmentIndex,
    required this.label,
    required this.subtitle,
    required this.icon,
    required this.color,
    this.voucher,
  });

  final String type;
  final int assignmentIndex;
  final String label;
  final String subtitle;
  final IconData icon;
  final Color color;
  final OpsVoucher? voucher;
}
