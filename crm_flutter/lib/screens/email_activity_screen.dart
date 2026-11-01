import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../core/emb_theme.dart';
import '../services/email_service.dart';
import '../services/service_utils.dart';
import '../widgets/common_widgets.dart' show formatDate;
import '../widgets/emb_widgets.dart';
import '../widgets/module_widgets.dart';

/// Email activity: inbox / sent / failed from /emails/mailbox with stats strip.
class EmailActivityScreen extends StatefulWidget {
  const EmailActivityScreen({super.key});

  @override
  State<EmailActivityScreen> createState() => _EmailActivityScreenState();
}

class _EmailActivityScreenState extends State<EmailActivityScreen> {
  Json _stats = {};
  int _key = 0;

  static const _filters = [
    ('inbox', 'Inbox'),
    ('sent', 'Sent'),
    ('failed', 'Failed'),
  ];

  Future<void> _loadStats() async {
    try {
      final s = await context.read<EmailService>().fetchStats();
      if (mounted) setState(() => _stats = s);
    } catch (_) {}
  }

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _sync() async {
    try {
      await context.read<EmailService>().syncReplies();
      if (!mounted) return;
      embSnack(context, 'Inbox synced');
      setState(() => _key++);
      _loadStats();
    } catch (e) {
      if (mounted) embSnack(context, apiErrorMessage(e), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final svc = context.read<EmailService>();
    final tiles = metricTilesFromMap(_stats, max: 4);
    return ModuleListScreen(
      key: ValueKey(_key),
      title: 'Email Activity',
      searchHint: 'Search emails',
      filters: _filters,
      emptyMessage: 'No emails in this folder',
      emptyIcon: Icons.mail_outline,
      actions: [
        IconButton(icon: const Icon(Icons.sync), tooltip: 'Sync replies', onPressed: _sync),
      ],
      header: tiles.isEmpty
          ? null
          : Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 4),
              child: SizedBox(
                height: 76,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  children: [
                    for (final t in tiles)
                      SizedBox(width: 140, child: Padding(padding: const EdgeInsets.only(right: 8), child: t)),
                  ],
                ),
              ),
            ),
      load: (folder, search) => svc.fetchMailbox(folder: folder.isEmpty ? 'inbox' : folder, search: search),
      itemBuilder: (context, m, reload) {
        final from = m['from'] is Map ? pickStr(m['from'] as Map, ['name', 'email']) : pickStr(m, ['from']);
        return EmbCard(
          onTap: () => openJsonDetail(
            context,
            title: pickStr(m, ['subject']) ?? 'Email',
            data: m,
            loader: (m['type'] != null && m['id'] != null)
                ? () => svc.fetchMessage(m['type'].toString(), m['id'].toString())
                : null,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(pickStr(m, ['subject']) ?? '(No subject)',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: embBody(size: 15, weight: FontWeight.w700)),
                  ),
                  if (pickStr(m, ['status']) != null)
                    EmbPill(prettyStatus(pickStr(m, ['status'])), color: statusTone(pickStr(m, ['status']))),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                [from, pickStr(m, ['leadName'])].whereType<String>().join(' • '),
                style: embBody(size: 12, color: EmbTheme.inkSoft),
              ),
              if ((pickStr(m, ['snippet']) ?? '').isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(pickStr(m, ['snippet'])!,
                      maxLines: 2, overflow: TextOverflow.ellipsis, style: embBody(size: 12, color: EmbTheme.muted)),
                ),
              const SizedBox(height: 4),
              Text(formatDate(pickStr(m, ['date'])), style: embBody(size: 11, color: EmbTheme.muted)),
            ],
          ),
        );
      },
    );
  }
}
