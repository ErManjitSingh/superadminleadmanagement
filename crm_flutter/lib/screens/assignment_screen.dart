import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../core/emb_theme.dart';
import '../models/models.dart';
import '../providers/auth_provider.dart';
import '../services/leads_service.dart';
import '../widgets/common_widgets.dart' show formatMoney, EmptyState;
import '../widgets/emb_widgets.dart';

/// Manager tool: list unassigned leads and assign them to a team member.
/// Uses GET /leads?filter=unassigned (role scoped), GET /leads/assignees, POST /leads/assign.
class AssignmentScreen extends StatefulWidget {
  const AssignmentScreen({super.key});

  @override
  State<AssignmentScreen> createState() => _AssignmentScreenState();
}

class _AssignmentScreenState extends State<AssignmentScreen> {
  bool loading = true;
  bool assigning = false;
  String? error;
  List<Lead> leads = [];
  List<Assignee> assignees = [];
  final Set<String> selected = {};

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final role = context.read<AuthProvider>().user?.role ?? 'sales_manager';
    final service = context.read<LeadsService>();
    setState(() {
      loading = true;
      error = null;
    });
    try {
      final results = await Future.wait([
        service.fetchLeads(role, filter: 'unassigned', limit: 100),
        service.fetchAssignees(),
      ]);
      if (!mounted) return;
      setState(() {
        leads = (results[0] as PaginatedResult<Lead>).items;
        assignees = results[1] as List<Assignee>;
        selected.removeWhere((id) => !leads.any((l) => l.id == id));
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

  Future<void> _assign() async {
    if (selected.isEmpty) return;
    final picked = await showModalBottomSheet<Assignee>(
      context: context,
      backgroundColor: EmbTheme.paper,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => SafeArea(
        child: ConstrainedBox(
          constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(ctx).height * 0.7),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: Text('Assign ${selected.length} lead(s) to…',
                    style: embBody(size: 16, weight: FontWeight.w800)),
              ),
              Flexible(
                child: assignees.isEmpty
                    ? const Padding(padding: EdgeInsets.all(24), child: Text('No assignees available'))
                    : ListView(
                        shrinkWrap: true,
                        children: [
                          for (final a in assignees)
                            ListTile(
                              leading: const CircleAvatar(
                                backgroundColor: EmbTheme.tealSoft,
                                child: Icon(Icons.person, color: EmbTheme.teal),
                              ),
                              title: Text(a.name, style: embBody(weight: FontWeight.w600)),
                              subtitle: Text(prettyStatus(a.role)),
                              onTap: () => Navigator.of(ctx).pop(a),
                            ),
                        ],
                      ),
              ),
            ],
          ),
        ),
      ),
    );
    if (picked == null || !mounted) return;

    setState(() => assigning = true);
    try {
      await context.read<LeadsService>().assignLeads(
            leadIds: selected.toList(),
            assigneeRole: picked.role,
            assigneeId: picked.id,
          );
      if (!mounted) return;
      embSnack(context, 'Assigned to ${picked.name}');
      selected.clear();
      assigning = false;
      await _load();
    } catch (e) {
      if (!mounted) return;
      setState(() => assigning = false);
      embSnack(context, apiErrorMessage(e), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: EmbTheme.cream,
      appBar: embAppBar('Assign Leads', actions: [
        if (leads.isNotEmpty)
          TextButton(
            onPressed: () => setState(() {
              if (selected.length == leads.length) {
                selected.clear();
              } else {
                selected
                  ..clear()
                  ..addAll(leads.map((l) => l.id));
              }
            }),
            child: Text(selected.length == leads.length ? 'Clear' : 'Select all'),
          ),
      ]),
      bottomNavigationBar: selected.isEmpty
          ? null
          : SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: EmbPrimaryButton(
                  label: 'Assign ${selected.length} selected',
                  icon: Icons.person_add_alt_1,
                  busy: assigning,
                  onPressed: _assign,
                ),
              ),
            ),
      body: loading
          ? const EmbLoading()
          : error != null
              ? EmbErrorView(message: error!, onRetry: _load)
              : RefreshIndicator(
                  color: EmbTheme.teal,
                  onRefresh: _load,
                  child: leads.isEmpty
                      ? ListView(children: const [EmptyState(message: 'No unassigned leads', icon: Icons.done_all)])
                      : ListView.builder(
                          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                          itemCount: leads.length,
                          itemBuilder: (_, i) {
                            final l = leads[i];
                            final on = selected.contains(l.id);
                            return EmbCard(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
                              onTap: () => setState(() => on ? selected.remove(l.id) : selected.add(l.id)),
                              child: Row(
                                children: [
                                  Checkbox(
                                    value: on,
                                    activeColor: EmbTheme.teal,
                                    onChanged: (_) =>
                                        setState(() => on ? selected.remove(l.id) : selected.add(l.id)),
                                  ),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(l.name, style: embBody(size: 15, weight: FontWeight.w700)),
                                        Text(
                                          [l.destination, l.phone]
                                              .where((e) => e != null && e.isNotEmpty)
                                              .join(' • '),
                                          style: embBody(size: 12, color: EmbTheme.inkSoft),
                                        ),
                                      ],
                                    ),
                                  ),
                                  if (l.budget != null)
                                    Padding(
                                      padding: const EdgeInsets.only(right: 8),
                                      child: Text(formatMoney(l.budget!),
                                          style: embBody(size: 13, weight: FontWeight.w700)),
                                    ),
                                ],
                              ),
                            );
                          },
                        ),
                ),
    );
  }
}
