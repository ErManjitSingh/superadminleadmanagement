import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../core/emb_theme.dart';
import '../models/models.dart';
import '../services/operations_service.dart';
import '../widgets/common_widgets.dart' show formatDate, EmptyState;
import '../widgets/emb_widgets.dart';

class OpsTasksScreen extends StatefulWidget {
  const OpsTasksScreen({super.key});

  @override
  State<OpsTasksScreen> createState() => _OpsTasksScreenState();
}

class _OpsTasksScreenState extends State<OpsTasksScreen> {
  bool loading = true;
  String? error;
  List<OpsTask> tasks = [];
  String filter = 'all';

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
      final t = await context.read<OperationsService>().fetchOpsTasks();
      if (!mounted) return;
      setState(() {
        tasks = t;
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

  bool _done(OpsTask t) => const {'completed', 'done'}.contains((t.status ?? '').toLowerCase());

  @override
  Widget build(BuildContext context) {
    final shown = tasks.where((t) {
      if (filter == 'open') return !_done(t);
      if (filter == 'done') return _done(t);
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: EmbTheme.cream,
      appBar: embAppBar('Tasks'),
      body: loading
          ? const EmbLoading()
          : error != null
              ? EmbErrorView(message: error!, onRetry: _load)
              : Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 10, 16, 4),
                      child: Row(
                        children: [
                          for (final f in const [('all', 'All'), ('open', 'Open'), ('done', 'Done')])
                            Padding(
                              padding: const EdgeInsets.only(right: 8),
                              child: ChoiceChip(
                                label: Text(f.$2),
                                selected: filter == f.$1,
                                selectedColor: EmbTheme.tealSoft,
                                onSelected: (_) => setState(() => filter = f.$1),
                              ),
                            ),
                        ],
                      ),
                    ),
                    Expanded(
                      child: RefreshIndicator(
                        color: EmbTheme.teal,
                        onRefresh: _load,
                        child: shown.isEmpty
                            ? ListView(children: const [EmptyState(message: 'No tasks')])
                            : ListView.builder(
                                padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                                itemCount: shown.length,
                                itemBuilder: (_, i) {
                                  final t = shown[i];
                                  final pr = (t.priority ?? '').toLowerCase();
                                  return EmbCard(
                                    child: Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Icon(
                                          _done(t) ? Icons.check_circle : Icons.radio_button_unchecked,
                                          color: _done(t) ? EmbTheme.mint : EmbTheme.muted,
                                        ),
                                        const SizedBox(width: 10),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(t.title, style: embBody(size: 15, weight: FontWeight.w700)),
                                              if (t.dueDate != null)
                                                Text('Due ${formatDate(t.dueDate)}',
                                                    style: embBody(size: 12, color: EmbTheme.inkSoft)),
                                              if (t.notes != null && t.notes!.isNotEmpty)
                                                Text(t.notes!, style: embBody(size: 12, color: EmbTheme.muted)),
                                            ],
                                          ),
                                        ),
                                        Column(
                                          crossAxisAlignment: CrossAxisAlignment.end,
                                          children: [
                                            EmbPill(prettyStatus(t.status), color: statusTone(t.status)),
                                            if (pr.isNotEmpty) ...[
                                              const SizedBox(height: 4),
                                              EmbPill(
                                                prettyStatus(pr),
                                                color: pr == 'high' || pr == 'urgent'
                                                    ? EmbTheme.danger
                                                    : EmbTheme.muted,
                                              ),
                                            ],
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
}
