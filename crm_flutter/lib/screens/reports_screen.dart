import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/emb_theme.dart';
import '../providers/auth_provider.dart';
import '../services/reports_service.dart';
import '../services/service_utils.dart';
import '../widgets/common_widgets.dart' show EmptyState;
import '../widgets/emb_widgets.dart';
import '../widgets/module_widgets.dart';

/// Role reports (manager / team leader / ops / admin analytics).
class ReportsScreen extends StatelessWidget {
  const ReportsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final role = context.read<AuthProvider>().user?.role ?? 'sales_executive';
    final svc = context.read<ReportsService>();
    return ModuleAsyncPage<Json>(
      title: 'Reports',
      load: () => svc.fetchRoleReport(role),
      builder: (context, data, reload) => ReportBody(data: data),
    );
  }
}

class ReportBody extends StatelessWidget {
  const ReportBody({super.key, required this.data});
  final Json data;

  static const _labelKeys = ['name', 'source', 'stage', 'destination', 'label', 'status', 'month', 'title', '_id'];

  @override
  Widget build(BuildContext context) {
    final children = <Widget>[];

    // Top-level numbers + nested stat maps (e.g. kpis / summary).
    final tiles = <Widget>[...metricTilesFromMap(data)];
    for (final e in data.entries) {
      if (e.value is Map && tiles.length < 12) {
        tiles.addAll(metricTilesFromMap(asMap(e.value), max: 12 - tiles.length));
      }
    }
    if (tiles.isNotEmpty) children.add(EmbMetricGrid(children: tiles));

    // Lists of rows.
    for (final e in data.entries) {
      final rows = e.value is List ? asMapList(e.value) : <Json>[];
      if (rows.isEmpty) continue;
      children.add(EmbSectionTitle(humanizeKey(e.key)));
      for (final r in rows.take(30)) {
        children.add(_row(r));
      }
    }

    // Text / boolean scalars (settings-style payloads).
    final details = data.entries
        .where((e) => e.value is String || e.value is bool)
        .map((e) => MapEntry(humanizeKey(e.key), displayValue(e.key, e.value)))
        .where((e) => e.value != null)
        .take(12)
        .toList();
    if (details.isNotEmpty) {
      children.add(const EmbSectionTitle('Details'));
      children.add(EmbCard(
        child: Column(
          children: [
            for (var i = 0; i < details.length; i++) ...[
              if (i > 0) const Divider(height: 16, color: EmbTheme.border),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(width: 120, child: Text(details[i].key, style: embBody(size: 12, color: EmbTheme.muted))),
                  Expanded(child: Text(details[i].value!, style: embBody(size: 14))),
                ],
              ),
            ],
          ],
        ),
      ));
    }

    if (children.isEmpty) {
      return ListView(children: const [EmptyState(message: 'No report data', icon: Icons.bar_chart)]);
    }
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
      children: children,
    );
  }

  Widget _row(Json r) {
    final title = pickStr(r, _labelKeys) ?? 'Item';
    final stats = r.entries.where((e) => e.value is num && !_labelKeys.contains(e.key)).take(4).toList();
    return EmbCard(
      child: Row(
        children: [
          Expanded(child: Text(title, style: embBody(size: 15, weight: FontWeight.w700))),
          for (final s in stats)
            Padding(
              padding: const EdgeInsets.only(left: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(displayValue(s.key, s.value) ?? '0', style: embBody(size: 14, weight: FontWeight.w800)),
                  Text(humanizeKey(s.key), style: embBody(size: 10, color: EmbTheme.muted)),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
