import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../core/emb_theme.dart';
import '../models/models.dart';
import '../services/operations_service.dart';
import '../widgets/emb_widgets.dart';
class _FieldDef {
  const _FieldDef(this.key, this.label, {this.number = false});
  final String key;
  final String label;
  final bool number;
}

/// CRM-style voucher edit → save payload + regenerate PDF.
class VoucherEditScreen extends StatefulWidget {
  const VoucherEditScreen({
    super.key,
    required this.voucher,
    this.booking,
  });

  final OpsVoucher voucher;
  final OpsBooking? booking;

  @override
  State<VoucherEditScreen> createState() => _VoucherEditScreenState();
}

class _VoucherEditScreenState extends State<VoucherEditScreen> {
  bool saving = false;
  late final Map<String, TextEditingController> _ctrls;

  String get _type {
    final t = (widget.voucher.type ?? '').toLowerCase();
    if (t == 'cab') return 'transport';
    return t.isEmpty ? 'hotel' : t;
  }

  List<_FieldDef> get _fields {
    switch (_type) {
      case 'transport':
        return const [
          _FieldDef('vehicleDisplayName', 'Vehicle'),
          _FieldDef('driverName', 'Driver Name'),
          _FieldDef('driverPhone', 'Driver Phone'),
          _FieldDef('pickupLocation', 'Pickup'),
          _FieldDef('dropLocation', 'Drop'),
          _FieldDef('vehicleNumber', 'Vehicle Number'),
          _FieldDef('amount', 'Cab Price / Total Cost (₹)', number: true),
          _FieldDef('advancePaid', 'Advance Paid (₹)', number: true),
          _FieldDef('remainingBalance', 'Remaining / Pending (₹)', number: true),
        ];
      case 'client':
        return const [
          _FieldDef('packageName', 'Package Name'),
          _FieldDef('pickup', 'Pickup'),
          _FieldDef('drop', 'Drop'),
          _FieldDef('amount', 'Total Package Cost (₹)', number: true),
          _FieldDef('advancePaid', 'Advance Paid (₹)', number: true),
          _FieldDef('remainingBalance', 'Remaining / Pending (₹)', number: true),
        ];
      default:
        return const [
          _FieldDef('hotelName', 'Hotel Name'),
          _FieldDef('roomType', 'Room Type'),
          _FieldDef('mealPlan', 'Meal Plan'),
          _FieldDef('address', 'Address'),
          _FieldDef('hotelPhone', 'Hotel Phone'),
          _FieldDef('amount', 'Hotel Price / Total Cost (₹)', number: true),
          _FieldDef('advancePaid', 'Advance Paid (₹)', number: true),
          _FieldDef('remainingBalance', 'Remaining / Pending (₹)', number: true),
        ];
    }
  }

  @override
  void initState() {
    super.initState();
    _ctrls = {for (final f in _fields) f.key: TextEditingController(text: _initial(f.key))};
    for (final key in ['amount', 'advancePaid']) {
      _ctrls[key]?.addListener(_recalcRemaining);
    }
  }

  Map<String, dynamic>? _at(List<Map<String, dynamic>> list, int index) {
    if (index < 0 || index >= list.length) return null;
    return list[index];
  }

  String _initial(String key) {
    final p = widget.voucher.payload;
    final booking = widget.booking;
    final idx = widget.voucher.assignmentIndex;
    final hotel = booking == null ? null : _at(booking.hotels, idx);
    final cab = booking == null ? null : _at(booking.transport, idx);
    final cab0 = booking == null ? null : _at(booking.transport, 0);

    String money(dynamic a, dynamic b) {
      final n = a ?? b;
      if (n == null || '$n'.isEmpty) return '';
      final v = num.tryParse('$n');
      return v == null ? '$n' : '$v';
    }

    switch (key) {
      case 'hotelName':
        return '${p['hotelName'] ?? p['name'] ?? hotel?['hotelName'] ?? hotel?['name'] ?? ''}';
      case 'roomType':
        return '${p['roomType'] ?? hotel?['roomType'] ?? ''}';
      case 'mealPlan':
        return '${p['mealPlan'] ?? hotel?['mealPlan'] ?? ''}';
      case 'address':
        return '${p['address'] ?? p['location'] ?? ''}';
      case 'hotelPhone':
        return '${p['hotelPhone'] ?? p['phone'] ?? ''}';
      case 'vehicleDisplayName':
        return '${p['vehicleDisplayName'] ?? p['vehicleType'] ?? cab?['vehicleType'] ?? ''}';
      case 'driverName':
        return '${p['driverName'] ?? cab?['driverName'] ?? ''}';
      case 'driverPhone':
        return '${p['driverPhone'] ?? cab?['driverPhone'] ?? ''}';
      case 'pickupLocation':
        return '${p['pickupLocation'] ?? booking?.destination ?? ''}';
      case 'dropLocation':
        return '${p['dropLocation'] ?? booking?.destination ?? ''}';
      case 'vehicleNumber':
        return '${p['vehicleNumber'] ?? p['vehicleName'] ?? ''}';
      case 'packageName':
        return '${p['packageName'] ?? booking?.packageName ?? ''}';
      case 'pickup':
        return '${p['pickup'] ?? cab0?['pickupLocation'] ?? ''}';
      case 'drop':
        return '${p['drop'] ?? cab0?['dropLocation'] ?? ''}';
      case 'amount':
        if (_type == 'client') {
          return money(p['amount'] ?? p['totalAmount'], booking?.totalAmount);
        }
        if (_type == 'hotel') {
          return money(p['amount'] ?? p['totalAmount'], hotel?['amount']);
        }
        return money(p['amount'] ?? p['totalAmount'], cab?['amount']);
      case 'advancePaid':
        if (_type == 'client') {
          return money(p['advancePaid'] ?? p['advanceReceived'], booking?.advanceReceived);
        }
        if (_type == 'hotel') {
          return money(p['advancePaid'], hotel?['advancePaid']);
        }
        return money(p['advancePaid'], cab?['advancePaid']);
      case 'remainingBalance':
        if (_type == 'client') {
          return money(p['remainingBalance'] ?? p['pendingAmount'], booking?.remainingBalance);
        }
        if (_type == 'hotel') {
          return money(p['remainingBalance'], hotel?['remainingBalance']);
        }
        return money(p['remainingBalance'], cab?['remainingBalance']);
      default:
        return '${p[key] ?? ''}';
    }
  }

  void _recalcRemaining() {
    final amount = num.tryParse(_ctrls['amount']?.text.trim() ?? '');
    final advance = num.tryParse(_ctrls['advancePaid']?.text.trim() ?? '');
    if (amount == null || advance == null) return;
    final rem = (amount - advance).clamp(0, double.infinity);
    final text = rem == rem.roundToDouble() ? '${rem.round()}' : '$rem';
    final ctrl = _ctrls['remainingBalance'];
    if (ctrl != null && ctrl.text != text) {
      ctrl.text = text;
    }
  }

  @override
  void dispose() {
    for (final c in _ctrls.values) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => saving = true);
    try {
      final form = <String, String>{
        for (final e in _ctrls.entries) e.key: e.value.text.trim(),
      };
      final updated = await context.read<OperationsService>().saveVoucherEdits(
            voucher: widget.voucher,
            type: _type,
            form: form,
            booking: widget.booking,
          );
      if (!mounted) return;
      embSnack(context, 'Voucher updated ${updated.voucherNumber ?? ''}');
      Navigator.of(context).pop(updated);
    } catch (e) {
      if (mounted) embSnack(context, apiErrorMessage(e), error: true);
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final v = widget.voucher;
    return Scaffold(
      backgroundColor: EmbTheme.cream,
      appBar: embAppBar(v.voucherNumber?.isNotEmpty == true ? 'Edit ${v.voucherNumber}' : 'Edit voucher'),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 40),
        children: [
          EmbCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Details edit karke Save & Regenerate dabao — PDF naya banega.',
                  style: embBody(size: 13, color: EmbTheme.inkSoft),
                ),
                const SizedBox(height: 4),
                Text(
                  '${v.prettyType}${v.version > 1 ? ' · v${v.version}' : ''}',
                  style: embBody(size: 12, color: EmbTheme.muted),
                ),
              ],
            ),
          ),
          const EmbSectionTitle('Fields'),
          for (final f in _fields) ...[
            Text(f.label, style: embBody(size: 12, weight: FontWeight.w700, color: EmbTheme.muted)),
            const SizedBox(height: 6),
            TextField(
              controller: _ctrls[f.key],
              keyboardType: f.number
                  ? const TextInputType.numberWithOptions(decimal: true)
                  : TextInputType.text,
              inputFormatters: f.number
                  ? [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))]
                  : null,
              decoration: embInput(f.label).copyWith(labelText: null, hintText: f.label),
            ),
            const SizedBox(height: 12),
          ],
          Text(
            'Remaining auto-calculate hota hai (total − advance). Zarurat ho to manually bhi badal sakte ho.',
            style: embBody(size: 11, color: EmbTheme.muted),
          ),
          const SizedBox(height: 20),
          FilledButton.icon(
            style: FilledButton.styleFrom(
              backgroundColor: EmbTheme.teal,
              foregroundColor: Colors.white,
              minimumSize: const Size.fromHeight(48),
            ),
            onPressed: saving ? null : _save,
            icon: saving
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Icon(Icons.save_outlined),
            label: Text(saving ? 'Saving…' : 'Save & Regenerate'),
          ),
        ],
      ),
    );
  }
}
