import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../core/emb_theme.dart';
import '../models/models.dart';
import '../providers/auth_provider.dart';
import '../services/followup_reminders.dart';
import '../services/followups_service.dart';
import '../widgets/common_widgets.dart';
import '../widgets/emb_widgets.dart';
import 'lead_detail_screen.dart';

class FollowupsScreen extends StatefulWidget {
  const FollowupsScreen({super.key});

  @override
  State<FollowupsScreen> createState() => _FollowupsScreenState();
}

class _FollowupsScreenState extends State<FollowupsScreen> with SingleTickerProviderStateMixin {
  late final TabController tabs;
  bool loading = true;
  String? error;
  List<FollowUp> items = [];
  String? _busyId;

  @override
  void initState() {
    super.initState();
    tabs = TabController(length: 4, vsync: this);
    tabs.addListener(() {
      if (!tabs.indexIsChanging) _load();
    });
    _load();
  }

  @override
  void dispose() {
    tabs.dispose();
    super.dispose();
  }

  /// Matches backend: today | upcoming | missed | completed(status).
  String get _tabKey {
    switch (tabs.index) {
      case 1:
        return 'upcoming';
      case 2:
        return 'missed';
      case 3:
        return 'completed';
      default:
        return 'today';
    }
  }

  Future<void> _load() async {
    final role = context.read<AuthProvider>().user?.role ?? 'sales_executive';
    setState(() {
      loading = true;
      error = null;
    });
    try {
      final svc = context.read<FollowupsService>();
      final result = await svc.fetchFollowUps(role, tab: _tabKey);
      if (!mounted) return;
      setState(() {
        items = result.items;
        loading = false;
      });
      // Keep local sound reminders in sync with server follow-ups.
      if (_tabKey == 'today' || _tabKey == 'upcoming') {
        // ignore: unawaited_futures
        FollowUpReminders.instance.syncAll(svc, role);
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        error = apiErrorMessage(e);
        loading = false;
      });
    }
  }

  Future<void> _complete(FollowUp f) async {
    if (_busyId != null) return;
    final role = context.read<AuthProvider>().user?.role ?? 'sales_executive';
    setState(() => _busyId = f.id);
    try {
      await context.read<FollowupsService>().complete(role, f.id);
      await FollowUpReminders.instance.cancelOne(f.id);
      if (!mounted) return;
      embSnack(context, 'Follow-up marked done');
      await _load();
    } catch (e) {
      if (!mounted) return;
      embSnack(context, apiErrorMessage(e), error: true);
    } finally {
      if (mounted) setState(() => _busyId = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        TabBar(
          controller: tabs,
          labelColor: EmbTheme.teal,
          unselectedLabelColor: EmbTheme.muted,
          indicatorColor: EmbTheme.teal,
          tabs: const [
            Tab(text: 'Today'),
            Tab(text: 'Upcoming'),
            Tab(text: 'Overdue'),
            Tab(text: 'Done'),
          ],
        ),
        Expanded(
          child: loading
              ? const EmbLoading()
              : error != null
                  ? EmbErrorView(message: error!, onRetry: _load)
                  : RefreshIndicator(
                      color: EmbTheme.teal,
                      onRefresh: _load,
                      child: items.isEmpty
                          ? ListView(children: const [EmptyState(message: 'No follow-ups')])
                          : ListView.builder(
                              padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
                              itemCount: items.length,
                              itemBuilder: (_, i) {
                                final f = items[i];
                                final busy = _busyId == f.id;
                                final done = f.status == 'completed';
                                return Card(
                                  margin: const EdgeInsets.only(bottom: 10),
                                  child: ListTile(
                                    title: Text(
                                      f.leadName ?? 'Lead',
                                      style: const TextStyle(fontWeight: FontWeight.w700),
                                    ),
                                    subtitle: Text(
                                      [
                                        if ((f.destination ?? '').isNotEmpty) f.destination!,
                                        formatDate(f.scheduledAt),
                                        if ((f.type ?? '').isNotEmpty) prettyStatus(f.type),
                                        if ((f.notes ?? '').isNotEmpty) f.notes!,
                                      ].join('\n'),
                                    ),
                                    isThreeLine: true,
                                    trailing: done
                                        ? const Icon(Icons.check_circle, color: EmbTheme.mint)
                                        : IconButton(
                                            tooltip: 'Mark done',
                                            icon: busy
                                                ? const SizedBox(
                                                    width: 18,
                                                    height: 18,
                                                    child: CircularProgressIndicator(strokeWidth: 2),
                                                  )
                                                : const Icon(Icons.check_circle_outline),
                                            onPressed: busy ? null : () => _complete(f),
                                          ),
                                    onTap: f.leadId == null
                                        ? null
                                        : () async {
                                            await Navigator.of(context).push(
                                              MaterialPageRoute(
                                                builder: (_) => LeadDetailScreen(leadId: f.leadId!),
                                              ),
                                            );
                                            if (mounted) _load();
                                          },
                                  ),
                                );
                              },
                            ),
                    ),
        ),
      ],
    );
  }
}
