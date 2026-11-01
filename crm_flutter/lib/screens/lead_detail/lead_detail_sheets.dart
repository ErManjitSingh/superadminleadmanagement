import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/emb_theme.dart';
import '../../core/roles.dart';
import '../../models/models.dart';
import '../../services/leads_service.dart';
import '../../services/whatsapp_pdf_share.dart';
import '../../widgets/common_widgets.dart' show formatMoney;
import '../../widgets/emb_widgets.dart';
import 'lead_detail_utils.dart';

Future<bool?> _show(BuildContext context, Widget sheet) => showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: EmbTheme.paper,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(22))),
      builder: (_) => sheet,
    );

Future<bool?> showStatusSheet(BuildContext context, {required Lead lead, required String role, String? initial}) =>
    _show(context, _StatusSheet(lead: lead, role: role, initial: initial));

Future<bool?> showCallNoteSheet(BuildContext context, {required Lead lead, required String role}) =>
    _show(context, _CallNoteSheet(lead: lead, role: role));

Future<bool?> showEmailSheet(BuildContext context, {required Lead lead, required String role}) =>
    _show(context, _EmailSheet(lead: lead, role: role));

Future<bool?> showAssignSheet(BuildContext context, {required Lead lead}) =>
    _show(context, _AssignSheet(lead: lead));

Future<bool?> showConvertSheet(BuildContext context, {required Lead lead}) =>
    _show(context, _ConvertSheet(lead: lead));

Future<bool?> showReactivateSheet(BuildContext context, {required Lead lead, required String role}) =>
    _show(context, _ReactivateSheet(lead: lead, role: role));

/// Shared chrome: drag handle, title, keyboard-aware scroll body, bottom safe area.
class _SheetFrame extends StatelessWidget {
  const _SheetFrame({required this.title, required this.children, this.subtitle});
  final String title;
  final String? subtitle;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final viewInsets = MediaQuery.viewInsetsOf(context).bottom;
    final safeBottom = MediaQuery.paddingOf(context).bottom;
    return Padding(
      padding: EdgeInsets.only(bottom: viewInsets),
      child: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(18, 10, 18, 18 + (viewInsets > 0 ? 0 : safeBottom)),
        keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 38,
                height: 4,
                margin: const EdgeInsets.only(bottom: 14),
                decoration: BoxDecoration(color: EmbTheme.border, borderRadius: BorderRadius.circular(4)),
              ),
            ),
            Text(title, style: embBody(size: 19, weight: FontWeight.w800)),
            if (subtitle != null)
              Padding(
                padding: const EdgeInsets.only(top: 2),
                child: Text(subtitle!, style: embBody(size: 12.5, color: EmbTheme.muted)),
              ),
            const SizedBox(height: 14),
            ...children,
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Change status
// ---------------------------------------------------------------------------

class _StatusSheet extends StatefulWidget {
  const _StatusSheet({required this.lead, required this.role, this.initial});
  final Lead lead;
  final String role;
  final String? initial;

  @override
  State<_StatusSheet> createState() => _StatusSheetState();
}

class _StatusSheetState extends State<_StatusSheet> {
  late String _status;
  final _reason = TextEditingController();
  bool _busy = false;

  List<String> get _options {
    final all = [
      'new',
      'contacted',
      'working_progress',
      'follow_up',
      'quotation_sent',
      'negotiation',
      if (widget.role != 'sales_executive') 'reactivated',
      'lost',
      'booked_from_another_company',
    ];
    if (!all.contains(_status)) return [_status, ...all];
    return all;
  }

  @override
  void initState() {
    super.initState();
    _status = widget.initial ?? widget.lead.status;
    _reason.text = widget.lead.statusReason ?? '';
  }

  @override
  void dispose() {
    _reason.dispose();
    super.dispose();
  }

  bool get _reasonRequired => reasonRequiredStatuses.contains(_status);

  Future<void> _save() async {
    if (_reasonRequired && _reason.text.trim().isEmpty) {
      embSnack(context, 'Please enter a reason', error: true);
      return;
    }
    setState(() => _busy = true);
    try {
      await context.read<LeadsService>().updateLeadStatus(
            widget.role,
            widget.lead.id,
            _status,
            reason: _reason.text,
          );
      if (!mounted) return;
      embSnack(context, 'Status updated to ${leadStatusLabel(_status)}');
      Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      setState(() => _busy = false);
      embSnack(context, apiErrorMessage(e), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return _SheetFrame(
      title: 'Change Status',
      subtitle: widget.lead.name,
      children: [
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final s in _options)
              ChoiceChip(
                label: Text(leadStatusLabel(s)),
                selected: _status == s,
                selectedColor: Color(leadStatusColor(s)).withValues(alpha: 0.18),
                labelStyle: embBody(
                  size: 13,
                  weight: FontWeight.w700,
                  color: _status == s ? Color(leadStatusColor(s)) : EmbTheme.inkSoft,
                ),
                onSelected: (_) => setState(() => _status = s),
              ),
          ],
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _reason,
          minLines: 2,
          maxLines: 4,
          decoration: embInput(_reasonRequired ? 'Reason (required)' : 'Reason / remarks (optional)'),
        ),
        const SizedBox(height: 16),
        EmbPrimaryButton(label: 'Update status', busy: _busy, onPressed: _save, icon: Icons.check),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Log call note
// ---------------------------------------------------------------------------

class _CallNoteSheet extends StatefulWidget {
  const _CallNoteSheet({required this.lead, required this.role});
  final Lead lead;
  final String role;
  @override
  State<_CallNoteSheet> createState() => _CallNoteSheetState();
}

class _CallNoteSheetState extends State<_CallNoteSheet> {
  String _outcome = 'interested';
  final _notes = TextEditingController();
  final _minutes = TextEditingController(text: '0');
  bool _busy = false;

  @override
  void dispose() {
    _notes.dispose();
    _minutes.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_notes.text.trim().isEmpty) {
      embSnack(context, 'Add call notes', error: true);
      return;
    }
    setState(() => _busy = true);
    try {
      await context.read<LeadsService>().addCallNote(
            widget.role,
            widget.lead.id,
            outcome: _outcome,
            notes: _notes.text.trim(),
            duration: (int.tryParse(_minutes.text.trim()) ?? 0) * 60,
          );
      if (!mounted) return;
      embSnack(context, 'Call note saved');
      Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      setState(() => _busy = false);
      embSnack(context, apiErrorMessage(e), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return _SheetFrame(
      title: 'Log Call Note',
      subtitle: widget.lead.name,
      children: [
        DropdownButtonFormField<String>(
          initialValue: _outcome,
          isExpanded: true,
          decoration: embInput('Outcome', icon: Icons.flag_outlined),
          items: [for (final o in callOutcomes) DropdownMenuItem(value: o.key, child: Text(o.value))],
          onChanged: (v) => setState(() => _outcome = v ?? _outcome),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _notes,
          minLines: 3,
          maxLines: 6,
          textCapitalization: TextCapitalization.sentences,
          decoration: embInput('Call notes *'),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _minutes,
          keyboardType: TextInputType.number,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          decoration: embInput('Duration (minutes)', icon: Icons.timer_outlined),
        ),
        const SizedBox(height: 16),
        EmbPrimaryButton(label: 'Save call note', busy: _busy, onPressed: _save, icon: Icons.phone_in_talk),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Send email
// ---------------------------------------------------------------------------

class _EmailSheet extends StatefulWidget {
  const _EmailSheet({required this.lead, required this.role});
  final Lead lead;
  final String role;
  @override
  State<_EmailSheet> createState() => _EmailSheetState();
}

class _EmailSheetState extends State<_EmailSheet> {
  late final TextEditingController _to = TextEditingController(text: widget.lead.email ?? '');
  late final TextEditingController _subject = TextEditingController(
    text: widget.lead.destination == null || widget.lead.destination!.isEmpty
        ? ''
        : 'Your ${widget.lead.destination} trip',
  );
  late final TextEditingController _body = TextEditingController(text: 'Hi ${widget.lead.name},\n\n');
  bool _busy = false;

  @override
  void dispose() {
    _to.dispose();
    _subject.dispose();
    _body.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    if (_to.text.trim().isEmpty || _subject.text.trim().isEmpty || _body.text.trim().isEmpty) {
      embSnack(context, 'Recipient, subject and message are required', error: true);
      return;
    }
    setState(() => _busy = true);
    try {
      await context.read<LeadsService>().sendLeadEmail(
            widget.role,
            widget.lead.id,
            to: _to.text.trim(),
            subject: _subject.text.trim(),
            message: _body.text.trim(),
          );
      if (!mounted) return;
      embSnack(context, 'Email queued');
      Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      setState(() => _busy = false);
      embSnack(context, apiErrorMessage(e), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return _SheetFrame(
      title: 'Send Email',
      subtitle: widget.lead.name,
      children: [
        TextField(
          controller: _to,
          keyboardType: TextInputType.emailAddress,
          decoration: embInput('To', icon: Icons.alternate_email),
        ),
        const SizedBox(height: 12),
        TextField(controller: _subject, decoration: embInput('Subject', icon: Icons.subject)),
        const SizedBox(height: 12),
        TextField(
          controller: _body,
          minLines: 5,
          maxLines: 10,
          textCapitalization: TextCapitalization.sentences,
          decoration: embInput('Message'),
        ),
        const SizedBox(height: 16),
        EmbPrimaryButton(label: 'Send email', busy: _busy, onPressed: _send, icon: Icons.send),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Assign lead
// ---------------------------------------------------------------------------

class _AssignSheet extends StatefulWidget {
  const _AssignSheet({required this.lead});
  final Lead lead;
  @override
  State<_AssignSheet> createState() => _AssignSheetState();
}

class _AssignSheetState extends State<_AssignSheet> {
  List<Assignee> _all = [];
  bool _loading = true;
  bool _busy = false;
  String? _error;
  String _filter = 'all';
  Assignee? _selected;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final list = await context.read<LeadsService>().fetchAssignees();
      if (!mounted) return;
      setState(() {
        _all = list;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = apiErrorMessage(e);
        _loading = false;
      });
    }
  }

  Future<void> _assign() async {
    final sel = _selected;
    if (sel == null) return;
    setState(() => _busy = true);
    try {
      await context.read<LeadsService>().assignLeads(
            leadIds: [widget.lead.id],
            assigneeRole: sel.role,
            assigneeId: sel.id,
          );
      if (!mounted) return;
      embSnack(context, 'Lead assigned to ${sel.name}');
      Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      setState(() => _busy = false);
      embSnack(context, apiErrorMessage(e), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final list = _filter == 'all' ? _all : _all.where((a) => a.role == _filter).toList();
    return _SheetFrame(
      title: 'Assign Lead',
      subtitle: widget.lead.assignedToName == null ? widget.lead.name : '${widget.lead.name} · currently ${widget.lead.assignedToName}',
      children: [
        if (_loading)
          const Padding(padding: EdgeInsets.all(24), child: EmbLoading())
        else if (_error != null)
          EmbErrorView(
            message: _error!,
            onRetry: () {
              setState(() {
                _loading = true;
                _error = null;
              });
              _load();
            },
          )
        else ...[
          Wrap(
            spacing: 8,
            children: [
              for (final f in const [
                ['all', 'All'],
                ['sales_executive', 'Executives'],
                ['team_leader', 'Team Leaders'],
                ['sales_manager', 'Managers'],
              ])
                ChoiceChip(
                  label: Text(f[1]),
                  selected: _filter == f[0],
                  onSelected: (_) => setState(() => _filter = f[0]),
                ),
            ],
          ),
          const SizedBox(height: 8),
          ConstrainedBox(
            constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * 0.4),
            child: list.isEmpty
                ? const Padding(padding: EdgeInsets.all(20), child: Center(child: Text('No assignees available')))
                : ListView.builder(
                    shrinkWrap: true,
                    itemCount: list.length,
                    itemBuilder: (_, i) {
                      final a = list[i];
                      final sel = _selected?.id == a.id;
                      return ListTile(
                        contentPadding: EdgeInsets.zero,
                        selected: sel,
                        selectedTileColor: EmbTheme.tealSoft,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        leading: CircleAvatar(
                          backgroundColor: EmbTheme.tealSoft,
                          child: Text(initialsOf(a.name), style: embBody(size: 12, weight: FontWeight.w800, color: EmbTheme.teal)),
                        ),
                        title: Text(a.name, style: embBody(weight: FontWeight.w700)),
                        subtitle: Text(roleLabels[a.role] ?? titleCase(a.role)),
                        trailing: sel ? const Icon(Icons.check_circle, color: EmbTheme.teal) : null,
                        onTap: () => setState(() => _selected = a),
                      );
                    },
                  ),
          ),
          const SizedBox(height: 12),
          EmbPrimaryButton(
            label: _selected == null ? 'Select an assignee' : 'Assign to ${_selected!.name}',
            busy: _busy,
            icon: Icons.how_to_reg,
            onPressed: _selected == null ? null : _assign,
          ),
        ],
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Convert lead (advance payment)
// ---------------------------------------------------------------------------

class _ConvertSheet extends StatefulWidget {
  const _ConvertSheet({required this.lead});
  final Lead lead;
  @override
  State<_ConvertSheet> createState() => _ConvertSheetState();
}

class _ConvertSheetState extends State<_ConvertSheet> {
  Map<String, dynamic> _preview = {};
  bool _loading = true;
  bool _busy = false;
  final _amount = TextEditingController();
  final _txn = TextEditingController();
  final _aadhaar = TextEditingController();
  final _remarks = TextEditingController();
  String _mode = 'upi';
  bool _sendReceipt = true;

  static const _modes = {
    'upi': 'UPI',
    'cash': 'Cash',
    'bank_transfer': 'Bank transfer',
    'credit_card': 'Credit card',
    'debit_card': 'Debit card',
    'cheque': 'Cheque',
  };

  @override
  void initState() {
    super.initState();
    _loadPreview();
  }

  @override
  void dispose() {
    _amount.dispose();
    _txn.dispose();
    _aadhaar.dispose();
    _remarks.dispose();
    super.dispose();
  }

  Future<void> _loadPreview() async {
    try {
      final p = await context.read<LeadsService>().fetchConvertPreview(widget.lead.id);
      if (!mounted) return;
      final total = (p['totalPackageCost'] as num?) ?? 0;
      setState(() {
        _preview = p;
        _loading = false;
        if (total > 0 && _amount.text.isEmpty) _amount.text = (total * 0.3).round().toString();
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  Future<void> _convert() async {
    final amount = num.tryParse(_amount.text.trim()) ?? 0;
    final aadhaar = _aadhaar.text.replaceAll(RegExp(r'\D'), '');
    if (amount <= 0) {
      embSnack(context, 'Enter the advance amount', error: true);
      return;
    }
    if (aadhaar.length != 12) {
      embSnack(context, 'Enter a valid 12-digit Aadhaar number', error: true);
      return;
    }
    setState(() => _busy = true);
    try {
      final result = await context.read<LeadsService>().convertLeadWithPayment(widget.lead.id, {
        'amount': amount,
        'paymentDate': DateTime.now().toIso8601String(),
        'mode': _mode,
        if (_txn.text.trim().isNotEmpty) 'transactionId': _txn.text.trim(),
        if (_remarks.text.trim().isNotEmpty) 'remarks': _remarks.text.trim(),
        'aadhaarNumber': aadhaar,
        'sendReceipt': _sendReceipt,
      });
      if (!mounted) return;

      if (_sendReceipt) {
        final wa = result['delivery'] is Map ? result['delivery']['whatsapp'] : null;
        if (wa is Map && (wa['prepared'] == true || wa['waMeUrl'] != null || wa['pdfBase64'] != null)) {
          await openWhatsAppWithPdf(
            waMeUrl: wa['waMeUrl']?.toString(),
            pdfBase64: wa['pdfBase64']?.toString(),
            fileName: wa['fileName']?.toString() ?? 'receipt.pdf',
            message: wa['message']?.toString(),
            phone: wa['phone']?.toString() ?? widget.lead.phone ?? widget.lead.whatsapp,
          );
        }
      }

      if (!mounted) return;
      embSnack(context, 'Lead converted to booking');
      Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      setState(() => _busy = false);
      embSnack(context, apiErrorMessage(e), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final total = (_preview['totalPackageCost'] as num?) ?? 0;
    return _SheetFrame(
      title: 'Convert Lead',
      subtitle: 'Record the first advance payment to create the booking',
      children: [
        if (_loading)
          const Padding(padding: EdgeInsets.all(20), child: EmbLoading())
        else ...[
          EmbCard(
            child: Column(
              children: [
                _kv('Customer', (_preview['customerName'] ?? widget.lead.name).toString()),
                if ((_preview['packageName'] ?? '').toString().isNotEmpty) _kv('Package', _preview['packageName'].toString()),
                if ((_preview['destination'] ?? '').toString().isNotEmpty) _kv('Destination', _preview['destination'].toString()),
                _kv('Travellers', '${_preview['travellers'] ?? '—'}'),
                _kv('Package total', total > 0 ? formatMoney(total) : '—'),
              ],
            ),
          ),
        ],
        TextField(
          controller: _amount,
          keyboardType: TextInputType.number,
          decoration: embInput('Advance amount (₹) *', icon: Icons.currency_rupee),
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          initialValue: _mode,
          decoration: embInput('Payment mode', icon: Icons.account_balance_wallet_outlined),
          items: [for (final e in _modes.entries) DropdownMenuItem(value: e.key, child: Text(e.value))],
          onChanged: (v) => setState(() => _mode = v ?? _mode),
        ),
        const SizedBox(height: 12),
        TextField(controller: _txn, decoration: embInput('Transaction / reference ID', icon: Icons.tag)),
        const SizedBox(height: 12),
        TextField(
          controller: _aadhaar,
          keyboardType: TextInputType.number,
          maxLength: 14,
          decoration: embInput('Aadhaar number (12 digits) *', icon: Icons.badge_outlined).copyWith(counterText: ''),
        ),
        const SizedBox(height: 12),
        TextField(controller: _remarks, minLines: 2, maxLines: 3, decoration: embInput('Remarks')),
        SwitchListTile(
          contentPadding: EdgeInsets.zero,
          activeThumbColor: EmbTheme.teal,
          title: Text('Send receipt to customer', style: embBody(size: 14, weight: FontWeight.w600)),
          value: _sendReceipt,
          onChanged: (v) => setState(() => _sendReceipt = v),
        ),
        const SizedBox(height: 8),
        EmbPrimaryButton(label: 'Convert to booking', busy: _busy, onPressed: _convert, icon: Icons.auto_awesome),
      ],
    );
  }

  Widget _kv(String k, String v) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 3),
        child: Row(
          children: [
            Text(k, style: embBody(size: 13, color: EmbTheme.muted)),
            const Spacer(),
            Flexible(child: Text(v, textAlign: TextAlign.right, style: embBody(size: 13.5, weight: FontWeight.w700))),
          ],
        ),
      );
}

// ---------------------------------------------------------------------------
// Reactivate lost lead
// ---------------------------------------------------------------------------

class _ReactivateSheet extends StatefulWidget {
  const _ReactivateSheet({required this.lead, required this.role});
  final Lead lead;
  final String role;
  @override
  State<_ReactivateSheet> createState() => _ReactivateSheetState();
}

class _ReactivateSheetState extends State<_ReactivateSheet> {
  final _reason = TextEditingController();
  List<Assignee> _execs = [];
  Assignee? _exec;
  bool _loading = true;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _reason.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final list = await context.read<LeadsService>().fetchAssignees();
      if (!mounted) return;
      setState(() {
        _execs = list.where((a) => a.role == 'sales_executive').toList();
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  Future<void> _save() async {
    if (_reason.text.trim().isEmpty) {
      embSnack(context, 'Reactivation reason is required', error: true);
      return;
    }
    if (_exec == null) {
      embSnack(context, 'Select an executive', error: true);
      return;
    }
    setState(() => _busy = true);
    try {
      await context.read<LeadsService>().reactivateLead(
            widget.role,
            widget.lead.id,
            reason: _reason.text.trim(),
            executiveId: _exec!.id,
          );
      if (!mounted) return;
      embSnack(context, 'Lead reactivated');
      Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      setState(() => _busy = false);
      embSnack(context, apiErrorMessage(e), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return _SheetFrame(
      title: 'Reactivate Lead',
      subtitle: widget.lead.name,
      children: [
        TextField(
          controller: _reason,
          minLines: 2,
          maxLines: 4,
          decoration: embInput('Reason for reactivation *'),
        ),
        const SizedBox(height: 12),
        if (_loading)
          const Padding(padding: EdgeInsets.all(12), child: EmbLoading())
        else
          DropdownButtonFormField<Assignee>(
            initialValue: _exec,
            isExpanded: true,
            decoration: embInput('Assign to executive *', icon: Icons.person_outline),
            items: [for (final a in _execs) DropdownMenuItem(value: a, child: Text(a.name))],
            onChanged: (v) => setState(() => _exec = v),
          ),
        const SizedBox(height: 16),
        EmbPrimaryButton(label: 'Reactivate lead', busy: _busy, onPressed: _save, icon: Icons.refresh),
      ],
    );
  }
}
