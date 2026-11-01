import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../core/emb_theme.dart';
import '../models/models.dart';
import '../services/operations_service.dart';
import '../services/whatsapp_pdf_share.dart';
import '../widgets/common_widgets.dart' show formatDate, EmptyState;
import '../widgets/emb_widgets.dart';
import 'ops_booking_vouchers_screen.dart';
import 'voucher_edit_screen.dart';
import 'voucher_preview_screen.dart';

const _types = [
  ('all', 'All'),
  ('hotel', 'Hotel'),
  ('cab', 'Cab'),
  ('client', 'Client'),
  ('activity', 'Activity'),
  ('flight', 'Flight'),
  ('travel-kit', 'Travel kit'),
];

class OpsVouchersScreen extends StatefulWidget {
  const OpsVouchersScreen({super.key, this.initialType = 'all'});
  final String initialType;

  @override
  State<OpsVouchersScreen> createState() => _OpsVouchersScreenState();
}

class _OpsVouchersScreenState extends State<OpsVouchersScreen> {
  bool loading = true;
  String? error;
  List<OpsVoucher> vouchers = [];
  late String type = widget.initialType;
  String? _busyId;
  final searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      loading = true;
      error = null;
    });
    try {
      final v = await context.read<OperationsService>().fetchOpsVouchers(type: type);
      if (!mounted) return;
      final q = searchCtrl.text.trim().toLowerCase();
      final filtered = q.isEmpty
          ? v
          : v.where((item) {
              final hay = [
                item.voucherNumber,
                item.customerName,
                item.customerPhone,
                item.bookingNumber,
                item.destination,
                item.title,
                item.type,
              ].whereType<String>().join(' ').toLowerCase();
              return hay.contains(q);
            }).toList();
      setState(() {
        vouchers = filtered;
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

  IconData _icon(String? t) {
    switch ((t ?? '').toLowerCase()) {
      case 'hotel':
        return Icons.hotel;
      case 'cab':
      case 'transport':
        return Icons.directions_car;
      case 'client':
        return Icons.description_outlined;
      case 'activity':
        return Icons.hiking;
      case 'flight':
        return Icons.flight;
      default:
        return Icons.confirmation_number_outlined;
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
    OpsBooking? booking;
    final bookingId = v.bookingId;
    if (bookingId != null && bookingId.isNotEmpty) {
      try {
        booking = await context.read<OperationsService>().fetchOpsBooking(bookingId);
      } catch (_) {}
    }
    if (!mounted) return;
    final updated = await Navigator.of(context).push<OpsVoucher>(
      MaterialPageRoute(
        builder: (_) => VoucherEditScreen(voucher: v, booking: booking),
      ),
    );
    if (!mounted) return;
    if (updated != null) {
      await _load();
      await _preview(updated);
    }
  }

  Future<void> _openBookingCenter(OpsVoucher v) async {
    final bookingId = v.bookingId;
    if (bookingId == null || bookingId.isEmpty) {
      embSnack(context, 'Booking link missing on this voucher', error: true);
      return;
    }
    await Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => OpsBookingVouchersScreen(bookingId: bookingId)),
    );
    if (mounted) _load();
  }

  Future<void> _sendWhatsApp(OpsVoucher v) async {
    if (_busyId != null) return;
    setState(() => _busyId = '${v.id}-wa');
    try {
      final data = await context.read<OperationsService>().sendVoucherWhatsApp(
            v.id,
            phone: v.customerPhone,
          );
      if (!mounted) return;
      final ok = await openWhatsAppWithPdf(
        waMeUrl: data['waMeUrl']?.toString(),
        pdfBase64: data['pdfBase64']?.toString(),
        fileName: data['fileName']?.toString() ?? 'voucher.pdf',
        message: data['message']?.toString(),
        phone: data['phone']?.toString() ?? v.customerPhone,
      );
      if (!mounted) return;
      if (ok) {
        embSnack(context, 'WhatsApp ready — attach / send voucher PDF');
        _load();
      } else {
        embSnack(context, 'Could not open WhatsApp', error: true);
      }
    } catch (e) {
      if (mounted) embSnack(context, apiErrorMessage(e), error: true);
    } finally {
      if (mounted) setState(() => _busyId = null);
    }
  }

  Future<void> _sendEmail(OpsVoucher v) async {
    if (_busyId != null) return;
    final initial = v.customerEmail ?? '';
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
            FilledButton(
              onPressed: () => Navigator.pop(ctx, ctrl.text.trim()),
              child: const Text('Send'),
            ),
          ],
        );
      },
    );
    if (to == null || to.isEmpty || !mounted) return;

    setState(() => _busyId = '${v.id}-email');
    try {
      await context.read<OperationsService>().sendVoucherEmail(v.id, to: to);
      if (!mounted) return;
      embSnack(context, 'Voucher emailed to $to');
      _load();
    } catch (e) {
      if (mounted) embSnack(context, apiErrorMessage(e), error: true);
    } finally {
      if (mounted) setState(() => _busyId = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: EmbTheme.cream,
      appBar: embAppBar('Vouchers'),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 10, 12, 4),
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: EmbTheme.border),
              ),
              child: TextField(
                controller: searchCtrl,
                style: embBody(size: 14, weight: FontWeight.w600),
                decoration: InputDecoration(
                  hintText: 'Search guest, phone, booking, voucher…',
                  hintStyle: embBody(size: 13, color: EmbTheme.muted),
                  prefixIcon: const Icon(Icons.search_rounded, color: EmbTheme.teal),
                  suffixIcon: IconButton(
                    onPressed: _load,
                    icon: const Icon(Icons.arrow_forward_rounded),
                  ),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 14),
                ),
                textInputAction: TextInputAction.search,
                onSubmitted: (_) => _load(),
              ),
            ),
          ),
          SizedBox(
            height: 50,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              children: [
                for (final t in _types)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: ChoiceChip(
                      label: Text(t.$2),
                      selected: type == t.$1,
                      selectedColor: EmbTheme.tealSoft,
                      onSelected: (_) {
                        type = t.$1;
                        _load();
                      },
                    ),
                  ),
              ],
            ),
          ),
          Expanded(
            child: loading
                ? const EmbLoading()
                : error != null
                    ? EmbErrorView(message: error!, onRetry: _load)
                    : RefreshIndicator(
                        color: EmbTheme.teal,
                        onRefresh: _load,
                        child: vouchers.isEmpty
                            ? ListView(children: const [EmptyState(message: 'No vouchers')])
                            : ListView.builder(
                                padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                                itemCount: vouchers.length,
                                itemBuilder: (_, i) {
                                  final v = vouchers[i];
                                  final waBusy = _busyId == '${v.id}-wa';
                                  final emailBusy = _busyId == '${v.id}-email';
                                  return EmbCard(
                                    onTap: () => _preview(v),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Container(
                                              padding: const EdgeInsets.all(10),
                                              decoration: BoxDecoration(
                                                color: EmbTheme.skySoft,
                                                borderRadius: BorderRadius.circular(12),
                                              ),
                                              child: Icon(_icon(v.type), color: EmbTheme.sky),
                                            ),
                                            const SizedBox(width: 12),
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Text(v.voucherNumber ?? 'Voucher',
                                                      style: embBody(size: 15, weight: FontWeight.w700)),
                                                  Text(
                                                    '${v.customerName ?? v.bookingNumber ?? '—'}'
                                                    '${v.destination != null ? ' • ${v.destination}' : ''}',
                                                    style: embBody(size: 12, color: EmbTheme.inkSoft),
                                                  ),
                                                  Text(
                                                    '${v.prettyType}${v.version > 1 ? ' · v${v.version}' : ''} · ${formatDate(v.createdAt)}',
                                                    style: embBody(size: 11, color: EmbTheme.muted),
                                                  ),
                                                ],
                                              ),
                                            ),
                                            EmbPill(prettyStatus(v.status), color: statusTone(v.status)),
                                          ],
                                        ),
                                        const SizedBox(height: 10),
                                        Wrap(
                                          spacing: 6,
                                          runSpacing: 6,
                                          children: [
                                            _chip(
                                              v.whatsappSent ? 'WhatsApp sent' : 'WhatsApp not sent',
                                              v.whatsappSent,
                                              Icons.chat,
                                            ),
                                            _chip(
                                              v.emailSent ? 'Email sent' : 'Email not sent',
                                              v.emailSent,
                                              Icons.mail_outline,
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 10),
                                        Row(
                                          children: [
                                            Expanded(
                                              child: OutlinedButton.icon(
                                                onPressed: _busyId != null ? null : () => _preview(v),
                                                icon: const Icon(Icons.visibility_outlined, size: 18),
                                                label: Text('Preview', style: embBody(size: 13, weight: FontWeight.w700)),
                                              ),
                                            ),
                                            const SizedBox(width: 8),
                                            Expanded(
                                              child: OutlinedButton.icon(
                                                onPressed: _busyId != null ? null : () => _edit(v),
                                                icon: const Icon(Icons.edit_outlined, size: 18),
                                                label: Text('Edit', style: embBody(size: 13, weight: FontWeight.w700)),
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 8),
                                        SizedBox(
                                          width: double.infinity,
                                          child: OutlinedButton.icon(
                                            onPressed: _busyId != null ? null : () => _openBookingCenter(v),
                                            icon: const Icon(Icons.tune, size: 18),
                                            label: Text('Manage booking vouchers', style: embBody(size: 13, weight: FontWeight.w700)),
                                          ),
                                        ),
                                        const SizedBox(height: 8),
                                        Row(
                                          children: [
                                            Expanded(
                                              child: OutlinedButton.icon(
                                                onPressed: _busyId != null ? null : () => _sendWhatsApp(v),
                                                icon: waBusy
                                                    ? const SizedBox(
                                                        width: 16,
                                                        height: 16,
                                                        child: CircularProgressIndicator(strokeWidth: 2),
                                                      )
                                                    : const Icon(Icons.chat, size: 18, color: Color(0xFF25D366)),
                                                label: Text(
                                                  waBusy ? 'Preparing…' : 'WhatsApp',
                                                  style: embBody(size: 13, weight: FontWeight.w700),
                                                ),
                                              ),
                                            ),
                                            const SizedBox(width: 8),
                                            Expanded(
                                              child: OutlinedButton.icon(
                                                onPressed: _busyId != null ? null : () => _sendEmail(v),
                                                icon: emailBusy
                                                    ? const SizedBox(
                                                        width: 16,
                                                        height: 16,
                                                        child: CircularProgressIndicator(strokeWidth: 2),
                                                      )
                                                    : const Icon(Icons.mail_outline, size: 18, color: EmbTheme.sky),
                                                label: Text(
                                                  emailBusy ? 'Sending…' : 'Email',
                                                  style: embBody(size: 13, weight: FontWeight.w700),
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  );
                                },
                              ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _chip(String label, bool ok, IconData icon) {
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
