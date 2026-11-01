import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/emb_theme.dart';
import '../services/service_utils.dart';
import '../services/team_service.dart';
import '../widgets/common_widgets.dart' show formatMoney;
import '../widgets/emb_widgets.dart';
import '../widgets/module_widgets.dart';

/// Users & roles (admin) / team members. [performance] shows /team/performance instead.
class TeamScreen extends StatelessWidget {
  const TeamScreen({super.key, this.performance = false});
  final bool performance;

  static const _filters = [
    ('', 'All'),
    ('active', 'Active'),
    ('disabled', 'Disabled'),
  ];

  @override
  Widget build(BuildContext context) {
    final svc = context.read<TeamService>();
    if (performance) return _PerformanceView(svc: svc);
    return ModuleListScreen(
      title: 'Users & Roles',
      searchHint: 'Search name, email or phone',
      filters: _filters,
      emptyMessage: 'No users found',
      emptyIcon: Icons.groups_outlined,
      load: (filter, search) => svc.fetchUsers(search: search, status: filter),
      itemBuilder: (context, u, reload) {
        final name = pickStr(u, ['name']) ?? 'User';
        final status = pickStr(u, ['status']) ?? 'active';
        return EmbCard(
          onTap: () => openJsonDetail(
            context,
            title: name,
            data: u,
            loader: () => svc.fetchUser(idOf(u)),
          ),
          child: Row(
            children: [
              CircleAvatar(
                backgroundColor: EmbTheme.tealSoft,
                child: Text(name[0].toUpperCase(), style: embBody(weight: FontWeight.w800, color: EmbTheme.teal)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name, style: embBody(size: 15, weight: FontWeight.w700)),
                    Text(pickStr(u, ['email']) ?? '', style: embBody(size: 12, color: EmbTheme.inkSoft)),
                    Text(pickStr(u, ['roleName', 'role']) ?? '', style: embBody(size: 12, color: EmbTheme.teal)),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  EmbPill(prettyStatus(status), color: status == 'active' ? EmbTheme.mint : EmbTheme.muted),
                  if (pickNum(u, ['assignedLeads']) > 0)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text('${pickNum(u, ['assignedLeads']).toInt()} leads',
                          style: embBody(size: 11, color: EmbTheme.muted)),
                    ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}

class _PerformanceView extends StatelessWidget {
  const _PerformanceView({required this.svc});
  final TeamService svc;

  @override
  Widget build(BuildContext context) {
    return ModuleAsyncPage<Json>(
      title: 'Team Performance',
      load: svc.fetchPerformance,
      builder: (context, data, reload) {
        // Find the first list of rows in the payload.
        List<Json> rows = [];
        for (final k in ['executives', 'team', 'members', 'performance', 'items']) {
          rows = asMapList(data[k]);
          if (rows.isNotEmpty) break;
        }
        if (rows.isEmpty) rows = asMapList(data);
        final tiles = metricTilesFromMap(data, max: 4);
        return ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
          children: [
            if (tiles.isNotEmpty) EmbMetricGrid(children: tiles),
            if (rows.isEmpty && tiles.isEmpty)
              const Padding(padding: EdgeInsets.all(32), child: Center(child: Text('No performance data'))),
            for (final r in rows)
              EmbCard(
                onTap: () => openJsonDetail(context, title: pickStr(r, ['name']) ?? 'Member', data: r),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(pickStr(r, ['name', 'executiveName']) ?? 'Member',
                          style: embBody(size: 15, weight: FontWeight.w700)),
                    ),
                    _stat('Leads', pickNum(r, ['assignedLeads', 'leads', 'totalLeads']).toInt().toString()),
                    _stat('Won', pickNum(r, ['conversions', 'converted', 'convertedLeads']).toInt().toString()),
                    if (pickNum(r, ['revenue']) > 0) _stat('Revenue', formatMoney(pickNum(r, ['revenue']))),
                  ],
                ),
              ),
          ],
        );
      },
    );
  }

  Widget _stat(String l, String v) => Padding(
        padding: const EdgeInsets.only(left: 14),
        child: Column(
          children: [
            Text(v, style: embBody(size: 14, weight: FontWeight.w800)),
            Text(l, style: embBody(size: 10, color: EmbTheme.muted)),
          ],
        ),
      );
}
