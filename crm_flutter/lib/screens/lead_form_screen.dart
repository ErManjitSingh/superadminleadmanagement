import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../core/emb_theme.dart';
import '../core/roles.dart';
import '../models/models.dart';
import '../providers/auth_provider.dart';
import '../services/leads_service.dart';
import '../widgets/emb_widgets.dart';

const _leadSources = [
  'website',
  'referral',
  'social',
  'walk-in',
  'phone',
  'whatsapp',
  'google_ads',
  'facebook_ads',
  'organic',
  'other',
];

/// Create or edit a lead. Pops with `true` when saved.
class LeadFormScreen extends StatefulWidget {
  const LeadFormScreen({super.key, this.lead});
  final Lead? lead;

  @override
  State<LeadFormScreen> createState() => _LeadFormScreenState();
}

class _LeadFormScreenState extends State<LeadFormScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _name;
  late final TextEditingController _phone;
  late final TextEditingController _email;
  late final TextEditingController _destination;
  late final TextEditingController _budget;
  late String _status;
  late String _source;
  bool _saving = false;

  bool get _isEdit => widget.lead != null;

  @override
  void initState() {
    super.initState();
    final l = widget.lead;
    _name = TextEditingController(text: l?.name ?? '');
    _phone = TextEditingController(text: l?.phone ?? '');
    _email = TextEditingController(text: l?.email ?? '');
    _destination = TextEditingController(text: l?.destination ?? '');
    _budget = TextEditingController(
      text: l?.budget == null ? '' : l!.budget!.round().toString(),
    );
    _status = leadStatusLabels.containsKey(l?.status) ? l!.status : 'new';
    _source = _leadSources.contains(l?.source) ? l!.source! : 'website';
  }

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _email.dispose();
    _destination.dispose();
    _budget.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    final role = context.read<AuthProvider>().user?.role ?? 'sales_executive';
    final service = context.read<LeadsService>();
    setState(() => _saving = true);
    final payload = <String, dynamic>{
      'name': _name.text.trim(),
      'phone': _phone.text.trim(),
      'email': _email.text.trim(),
      'destination': _destination.text.trim(),
      'budget': num.tryParse(_budget.text.trim()) ?? 0,
      'status': _status,
      'source': _source,
      'leadSource': _source,
    };
    try {
      if (_isEdit) {
        await service.updateLead(role, widget.lead!.id, payload);
      } else {
        await service.createLead(payload);
      }
      if (!mounted) return;
      embSnack(context, _isEdit ? 'Lead updated' : 'Lead created');
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
      appBar: embAppBar(_isEdit ? 'Edit Lead' : 'New Lead'),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _name,
              textCapitalization: TextCapitalization.words,
              decoration: embInput('Customer name *', icon: Icons.person_outline),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Name is required' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _phone,
              keyboardType: TextInputType.phone,
              decoration: embInput('Phone *', icon: Icons.phone_outlined),
              validator: (v) => (v == null || v.trim().length < 7) ? 'Enter a valid phone' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              decoration: embInput('Email', icon: Icons.email_outlined),
              validator: (v) {
                final t = v?.trim() ?? '';
                if (t.isEmpty) return null;
                return RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(t) ? null : 'Invalid email';
              },
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _destination,
              textCapitalization: TextCapitalization.words,
              decoration: embInput('Destination', icon: Icons.place_outlined),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _budget,
              keyboardType: TextInputType.number,
              decoration: embInput('Budget (₹) *', icon: Icons.currency_rupee),
              validator: (v) {
                final n = num.tryParse((v ?? '').trim());
                return (n == null || n <= 0) ? 'Budget is required' : null;
              },
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _status,
              decoration: embInput('Status', icon: Icons.flag_outlined),
              items: leadStatusLabels.entries
                  .map((e) => DropdownMenuItem(value: e.key, child: Text(e.value)))
                  .toList(),
              onChanged: (v) => setState(() => _status = v ?? _status),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _source,
              decoration: embInput('Source', icon: Icons.campaign_outlined),
              items: _leadSources
                  .map((s) => DropdownMenuItem(value: s, child: Text(prettyStatus(s.replaceAll('-', '_')))))
                  .toList(),
              onChanged: (v) => setState(() => _source = v ?? _source),
            ),
            const SizedBox(height: 24),
            EmbPrimaryButton(
              label: _isEdit ? 'Save changes' : 'Create lead',
              busy: _saving,
              onPressed: _save,
            ),
          ],
        ),
      ),
    );
  }
}
