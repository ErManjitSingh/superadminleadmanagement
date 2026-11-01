import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/emb_theme.dart';
import '../services/reminders_service.dart';
import '../services/service_utils.dart';
import '../widgets/common_widgets.dart' show formatDate;
import '../widgets/emb_widgets.dart';
import '../widgets/module_widgets.dart';
import 'lead_detail_screen.dart';

/// Reminder center: follow-up reminders by tab (today / upcoming / overdue / missed).
class RemindersScreen extends StatelessWidget {
  const RemindersScreen({super.key, this.initialTab = 'today'});
  final String initialTab;

  static const _filters = [
    ('today', 'Today'),
    ('upcoming', 'Upcoming'),
    ('overdue', 'Overdue'),
    ('missed', 'Missed'),
  ];

  @override
  Widget build(BuildContext context) {
    final svc = context.read<RemindersService>();
    return ModuleListScreen(
      title: 'Reminder Center',
      filters: _filters,
      initialFilter: initialTab,
      emptyMessage: 'No reminders',
      emptyIcon: Icons.alarm,
      load: (tab, _) => svc.fetchReminders(tab: tab.isEmpty ? 'today' : tab),
      itemBuilder: (context, r, reload) {
        final lead = asMap(r['lead']);
        final leadId = (lead['_id'] ?? r['leadId'] ?? '').toString();
        final status = pickStr(r, ['status']);
        return EmbCard(
          onTap: leadId.isEmpty
              ? null
              : () async {
                  await Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => LeadDetailScreen(leadId: leadId)),
                  );
                  reload();
                },
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: EmbTheme.saffronSoft, borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.alarm, color: EmbTheme.saffron, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(pickStr(lead, ['name']) ?? pickStr(r, ['leadName']) ?? 'Lead',
                        style: embBody(size: 15, weight: FontWeight.w700)),
                    Text(
                      [pickStr(lead, ['destination']), prettyStatus(pickStr(r, ['type']))]
                          .whereType<String>()
                          .where((s) => s != '—')
                          .join(' • '),
                      style: embBody(size: 12, color: EmbTheme.inkSoft),
                    ),
                    Text(formatDate(pickStr(r, ['scheduledAt'])), style: embBody(size: 12, color: EmbTheme.muted)),
                  ],
                ),
              ),
              if (status != null) EmbPill(prettyStatus(status), color: statusTone(status)),
            ],
          ),
        );
      },
    );
  }
}
