import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../core/emb_theme.dart';
import '../providers/auth_provider.dart';
import '../services/followup_reminders.dart';
import '../services/followups_service.dart';
import '../widgets/emb_widgets.dart';

/// Create a follow-up for a lead. Pops with `true` when saved.
class FollowupFormScreen extends StatefulWidget {
  const FollowupFormScreen({super.key, required this.leadId, this.leadName});
  final String leadId;
  final String? leadName;

  @override
  State<FollowupFormScreen> createState() => _FollowupFormScreenState();
}

class _FollowupFormScreenState extends State<FollowupFormScreen> {
  final _notes = TextEditingController();
  DateTime _when = DateTime.now().add(const Duration(hours: 2));
  String _type = 'call';
  String _priority = 'medium';
  String _category = 'warm';
  bool _saving = false;

  @override
  void dispose() {
    _notes.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final d = await showDatePicker(
      context: context,
      initialDate: _when,
      firstDate: DateTime.now().subtract(const Duration(days: 1)),
      lastDate: DateTime.now().add(const Duration(days: 730)),
    );
    if (d == null || !mounted) return;
    final t = await showTimePicker(context: context, initialTime: TimeOfDay.fromDateTime(_when));
    if (!mounted) return;
    setState(() {
      _when = DateTime(d.year, d.month, d.day, t?.hour ?? _when.hour, t?.minute ?? _when.minute);
    });
  }

  Future<void> _save() async {
    final role = context.read<AuthProvider>().user?.role ?? 'sales_executive';
    setState(() => _saving = true);
    try {
      final svc = context.read<FollowupsService>();
      final created = await svc.create(
        role,
        leadId: widget.leadId,
        scheduledAt: _when,
        notes: _notes.text,
        priority: _priority,
        type: _type,
        category: _category,
      );

      // Alert at the exact scheduled time (+ sync all other pending follow-ups).
      final fuId = created?.id;
      if (fuId != null && fuId.isNotEmpty) {
        await FollowUpReminders.instance.scheduleOne(
          followUpId: fuId,
          scheduledAt: _when,
          leadName: widget.leadName ?? created?.leadName,
          type: _type,
          notes: _notes.text,
          leadId: widget.leadId,
        );
      } else {
        // API didn't return id — still schedule with a stable local key.
        await FollowUpReminders.instance.scheduleOne(
          followUpId: '${widget.leadId}-${_when.millisecondsSinceEpoch}',
          scheduledAt: _when,
          leadName: widget.leadName,
          type: _type,
          notes: _notes.text,
          leadId: widget.leadId,
        );
      }
      // Ensure every other pending follow-up also has a sound reminder.
      await FollowUpReminders.instance.syncAll(svc, role);

      if (!mounted) return;
      embSnack(context, 'Follow-up set — reminder with sound at scheduled time');
      Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      setState(() => _saving = false);
      embSnack(context, apiErrorMessage(e), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: EmbTheme.cream,
      appBar: embAppBar('New Follow-up'),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (widget.leadName != null)
            EmbCard(
              child: Row(
                children: [
                  const Icon(Icons.person_outline, color: EmbTheme.teal),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(widget.leadName!, style: embBody(size: 16, weight: FontWeight.w700)),
                  ),
                ],
              ),
            ),
          InkWell(
            onTap: _pickDate,
            borderRadius: BorderRadius.circular(12),
            child: InputDecorator(
              decoration: embInput('Date & time', icon: Icons.event_outlined),
              child: Text(DateFormat('EEE, dd MMM yyyy • hh:mm a').format(_when), style: embBody()),
            ),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: _type,
            decoration: embInput('Type', icon: Icons.category_outlined),
            items: const ['call', 'whatsapp', 'email', 'meeting', 'other']
                .map((e) => DropdownMenuItem(value: e, child: Text(prettyStatus(e))))
                .toList(),
            onChanged: (v) => setState(() => _type = v ?? _type),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: _category,
            decoration: embInput('Category', icon: Icons.label_outline),
            items: const [
              ('warm', 'Warm'),
              ('cold', 'Cold'),
              ('expected_conv', 'Expected conversion'),
              ('converted', 'Converted'),
            ]
                .map((e) => DropdownMenuItem(value: e.$1, child: Text(e.$2)))
                .toList(),
            onChanged: (v) => setState(() => _category = v ?? _category),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: _priority,
            decoration: embInput('Priority', icon: Icons.priority_high),
            items: const ['low', 'medium', 'high', 'urgent']
                .map((e) => DropdownMenuItem(value: e, child: Text(prettyStatus(e))))
                .toList(),
            onChanged: (v) => setState(() => _priority = v ?? _priority),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _notes,
            minLines: 3,
            maxLines: 5,
            decoration: embInput('Notes', hint: 'What should you discuss?'),
          ),
          const SizedBox(height: 24),
          EmbPrimaryButton(label: 'Schedule follow-up', icon: Icons.event_available, busy: _saving, onPressed: _save),
        ],
      ),
    );
  }
}
