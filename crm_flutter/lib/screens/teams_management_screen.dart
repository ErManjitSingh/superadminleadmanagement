import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../core/emb_theme.dart';
import '../services/service_utils.dart';
import '../services/team_service.dart';
import '../widgets/emb_widgets.dart';
import '../widgets/module_widgets.dart';

/// Sales manager: teams list, create team, manage members.
class TeamsManagementScreen extends StatefulWidget {
  const TeamsManagementScreen({super.key});

  @override
  State<TeamsManagementScreen> createState() => _TeamsManagementScreenState();
}

class _TeamsManagementScreenState extends State<TeamsManagementScreen> {
  int _key = 0;

  Future<void> _create() async {
    final svc = context.read<TeamService>();
    List<Json> leaders;
    try {
      leaders = await svc.fetchTeamLeaders();
    } catch (e) {
      if (mounted) embSnack(context, apiErrorMessage(e), error: true);
      return;
    }
    if (!mounted) return;
    final name = TextEditingController();
    String? leaderId;
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setLocal) => AlertDialog(
          title: Text('New team', style: embBody(size: 18, weight: FontWeight.w700)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: name, decoration: embInput('Team name')),
              const SizedBox(height: 10),
              DropdownButtonFormField<String>(
                initialValue: leaderId,
                isExpanded: true,
                decoration: embInput('Team leader'),
                items: [
                  for (final l in leaders)
                    DropdownMenuItem(value: idOf(l), child: Text(pickStr(l, ['name', 'email']) ?? 'Leader')),
                ],
                onChanged: (v) => setLocal(() => leaderId = v),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
            FilledButton(
              style: FilledButton.styleFrom(backgroundColor: EmbTheme.teal),
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Create'),
            ),
          ],
        ),
      ),
    );
    if (ok != true || !mounted) return;
    if (name.text.trim().isEmpty || leaderId == null) {
      embSnack(context, 'Team name and leader are required', error: true);
      return;
    }
    try {
      await svc.createTeam(name: name.text.trim(), teamLeaderId: leaderId!);
      if (!mounted) return;
      embSnack(context, 'Team created');
      setState(() => _key++);
    } catch (e) {
      if (mounted) embSnack(context, apiErrorMessage(e), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final svc = context.read<TeamService>();
    return ModuleListScreen(
      key: ValueKey(_key),
      title: 'Team Management',
      emptyMessage: 'No teams yet',
      emptyIcon: Icons.groups_outlined,
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: EmbTheme.teal,
        foregroundColor: Colors.white,
        onPressed: _create,
        icon: const Icon(Icons.group_add),
        label: const Text('New team'),
      ),
      load: (_, _) => svc.fetchTeams(),
      itemBuilder: (context, t, reload) {
        final members = asMapList(t['members']);
        final stats = asMap(t['stats']);
        return EmbCard(
          onTap: () async {
            await Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => _TeamDetailScreen(team: t)),
            );
            reload();
          },
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: EmbTheme.tealSoft, borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.groups_rounded, color: EmbTheme.teal),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(pickStr(t, ['name']) ?? 'Team', style: embBody(size: 16, weight: FontWeight.w700)),
                    Text('Leader: ${pickStr(t, ['teamLeader']) ?? '—'}',
                        style: embBody(size: 12, color: EmbTheme.inkSoft)),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('${members.length}', style: embBody(size: 18, weight: FontWeight.w800)),
                  Text('members', style: embBody(size: 10, color: EmbTheme.muted)),
                  if (stats.isNotEmpty && pickNum(stats, ['totalLeads', 'leads']) > 0)
                    Text('${pickNum(stats, ['totalLeads', 'leads']).toInt()} leads',
                        style: embBody(size: 10, color: EmbTheme.muted)),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}

class _TeamDetailScreen extends StatefulWidget {
  const _TeamDetailScreen({required this.team});
  final Json team;

  @override
  State<_TeamDetailScreen> createState() => _TeamDetailScreenState();
}

class _TeamDetailScreenState extends State<_TeamDetailScreen> {
  late final List<Json> _members = asMapList(widget.team['members']);

  String get _teamId => idOf(widget.team);

  Future<void> _remove(Json m) async {
    try {
      await context.read<TeamService>().removeMember(_teamId, idOf(m));
      if (!mounted) return;
      setState(() => _members.removeWhere((x) => idOf(x) == idOf(m)));
      embSnack(context, 'Member removed');
    } catch (e) {
      if (mounted) embSnack(context, apiErrorMessage(e), error: true);
    }
  }

  Future<void> _add() async {
    final svc = context.read<TeamService>();
    List<Json> available;
    try {
      available = await svc.fetchAvailableExecutives();
    } catch (e) {
      if (mounted) embSnack(context, apiErrorMessage(e), error: true);
      return;
    }
    if (!mounted) return;
    if (available.isEmpty) {
      embSnack(context, 'No available executives');
      return;
    }
    final picked = await showModalBottomSheet<Json>(
      context: context,
      backgroundColor: EmbTheme.white,
      builder: (ctx) => SafeArea(
        child: ListView(
          shrinkWrap: true,
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text('Add executive', style: embBody(size: 17, weight: FontWeight.w700)),
            ),
            for (final e in available)
              ListTile(
                leading: const Icon(Icons.person_add_alt_1, color: EmbTheme.teal),
                title: Text(pickStr(e, ['name']) ?? 'Executive'),
                subtitle: Text(pickStr(e, ['email']) ?? ''),
                onTap: () => Navigator.pop(ctx, e),
              ),
          ],
        ),
      ),
    );
    if (picked == null || !mounted) return;
    try {
      await svc.addMember(_teamId, idOf(picked));
      if (!mounted) return;
      setState(() => _members.add(picked));
      embSnack(context, 'Member added');
    } catch (e) {
      if (mounted) embSnack(context, apiErrorMessage(e), error: true);
    }
  }

  Future<void> _deleteTeam() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete team?'),
        content: const Text('Members will be unassigned from this team.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: EmbTheme.danger),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    try {
      await context.read<TeamService>().deleteTeam(_teamId);
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      if (mounted) embSnack(context, apiErrorMessage(e), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: EmbTheme.cream,
      appBar: embAppBar(pickStr(widget.team, ['name']) ?? 'Team', actions: [
        IconButton(icon: const Icon(Icons.delete_outline), tooltip: 'Delete team', onPressed: _deleteTeam),
      ]),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: EmbTheme.teal,
        foregroundColor: Colors.white,
        onPressed: _add,
        icon: const Icon(Icons.person_add),
        label: const Text('Add member'),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 96),
        children: [
          EmbCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Team leader', style: embBody(size: 12, color: EmbTheme.muted)),
                Text(pickStr(widget.team, ['teamLeader']) ?? '—', style: embBody(size: 16, weight: FontWeight.w700)),
                if ((pickStr(widget.team, ['description']) ?? '').isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Text(pickStr(widget.team, ['description'])!, style: embBody(size: 13, color: EmbTheme.inkSoft)),
                  ),
              ],
            ),
          ),
          EmbSectionTitle('Members (${_members.length})'),
          for (final m in _members)
            EmbCard(
              child: Row(
                children: [
                  const Icon(Icons.person_outline, color: EmbTheme.teal),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(pickStr(m, ['name']) ?? 'Member', style: embBody(weight: FontWeight.w700)),
                        Text(pickStr(m, ['email']) ?? '', style: embBody(size: 12, color: EmbTheme.inkSoft)),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.remove_circle_outline, color: EmbTheme.danger),
                    onPressed: () => _remove(m),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
