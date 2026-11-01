import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../core/emb_theme.dart';
import '../services/service_utils.dart';
import '../services/team_service.dart';
import '../widgets/common_widgets.dart' show EmptyState;
import '../widgets/emb_widgets.dart';
import '../widgets/module_widgets.dart';
import 'lead_detail_screen.dart';

/// Team leader: stuck + high-value leads, escalate to sales manager.
class EscalationsScreen extends StatefulWidget {
  const EscalationsScreen({super.key});

  @override
  State<EscalationsScreen> createState() => _EscalationsScreenState();
}

class _EscalationsScreenState extends State<EscalationsScreen> {
  final _escalated = <String>{};

  Future<void> _escalate(Json lead) async {
    try {
      await context.read<TeamService>().escalate(lead);
      if (!mounted) return;
      setState(() => _escalated.add(idOf(lead)));
      embSnack(context, 'Escalated to Sales Manager');
    } catch (e) {
      if (mounted) embSnack(context, apiErrorMessage(e), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final svc = context.read<TeamService>();
    return ModuleAsyncPage<Json>(
      title: 'Lead Escalations',
      load: svc.fetchEscalations,
      builder: (context, data, reload) {
        final stuck = asMapList(data['stuck']);
        final high = asMapList(data['highValue']);
        if (stuck.isEmpty && high.isEmpty) {
          return ListView(children: const [
            EmptyState(message: 'Nothing to escalate right now', icon: Icons.warning_amber_rounded),
          ]);
        }
        return ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
          children: [
            if (stuck.isNotEmpty) const EmbSectionTitle('Stuck leads'),
            for (final l in stuck) _card(l, EmbTheme.saffron),
            if (high.isNotEmpty) const EmbSectionTitle('High-value leads'),
            for (final l in high) _card(l, EmbTheme.teal),
          ],
        );
      },
    );
  }

  Widget _card(Json l, Color tone) {
    final done = _escalated.contains(idOf(l));
    return EmbCard(
      onTap: () => Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => LeadDetailScreen(leadId: idOf(l))),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(child: Text(pickStr(l, ['name']) ?? 'Lead', style: embBody(size: 16, weight: FontWeight.w700))),
              if (pickStr(l, ['status']) != null) EmbPill(prettyStatus(pickStr(l, ['status'])), color: tone),
            ],
          ),
          const SizedBox(height: 4),
          Text(pickStr(l, ['reason']) ?? '', style: embBody(size: 13, color: EmbTheme.inkSoft)),
          Text(
            [pickStr(l, ['destination']), pickStr(l, ['assignedTo'])].whereType<String>().join(' • '),
            style: embBody(size: 12, color: EmbTheme.muted),
          ),
          const SizedBox(height: 8),
          Align(
            alignment: Alignment.centerRight,
            child: OutlinedButton.icon(
              onPressed: done ? null : () => _escalate(l),
              icon: Icon(done ? Icons.check : Icons.arrow_upward, size: 16),
              label: Text(done ? 'Escalated' : 'Escalate'),
            ),
          ),
        ],
      ),
    );
  }
}
