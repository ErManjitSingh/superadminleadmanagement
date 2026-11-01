import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../core/emb_theme.dart';
import '../services/service_utils.dart';
import '../services/team_service.dart';
import '../widgets/common_widgets.dart' show EmptyState, formatDate;
import '../widgets/emb_widgets.dart';
import '../widgets/module_widgets.dart';

/// Attendance: my check-in/out + today's team summary and records.
class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  int _key = 0;
  bool _busy = false;

  Future<void> _run(Future<void> Function() fn, String ok) async {
    setState(() => _busy = true);
    try {
      await fn();
      if (!mounted) return;
      embSnack(context, ok);
      setState(() => _key++);
    } catch (e) {
      if (mounted) embSnack(context, apiErrorMessage(e), error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final svc = context.read<TeamService>();
    return ModuleAsyncPage<Json>(
      key: ValueKey(_key),
      title: 'Attendance',
      load: () async {
        final summary = await svc.fetchAttendanceSummary();
        Json status = asMap(summary['myStatus']);
        if (status.isEmpty) {
          try {
            status = await svc.fetchMyAttendanceStatus();
          } catch (_) {}
        }
        return {...summary, 'myStatus': status};
      },
      builder: (context, data, reload) {
        final my = asMap(data['myStatus']);
        final summary = asMap(data['summary']);
        final records = asMapList(data['teamAttendance']);
        final absent = asMapList(data['absentUsers']);
        final tiles = <Widget>[
          EmbMetric(label: 'Present', value: '${pickNum(summary, ['presentToday']).toInt()}', icon: Icons.how_to_reg, color: EmbTheme.mint),
          EmbMetric(label: 'Absent', value: '${pickNum(summary, ['absentToday']).toInt()}', icon: Icons.person_off_outlined, color: EmbTheme.coral),
          EmbMetric(label: 'Late', value: '${pickNum(summary, ['lateToday']).toInt()}', icon: Icons.schedule, color: EmbTheme.saffron),
          EmbMetric(label: 'WFH', value: '${pickNum(summary, ['wfhCount']).toInt()}', icon: Icons.home_work_outlined, color: EmbTheme.sky),
        ];
        return ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
          children: [
            if (my['requiresCheckIn'] == true) _myCard(my, svc),
            if (summary.isNotEmpty) EmbMetricGrid(children: tiles),
            if (records.isNotEmpty) const EmbSectionTitle('Today'),
            for (final r in records)
              EmbCard(
                onTap: () => openJsonDetail(context, title: pickStr(r, ['userName']) ?? 'Attendance', data: r),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(pickStr(r, ['userName']) ?? 'User', style: embBody(size: 15, weight: FontWeight.w700)),
                          Text(
                            'In ${formatDate(pickStr(r, ['checkIn']))}',
                            style: embBody(size: 12, color: EmbTheme.inkSoft),
                          ),
                        ],
                      ),
                    ),
                    EmbPill(prettyStatus(pickStr(r, ['workMode'])), color: EmbTheme.sky),
                    const SizedBox(width: 6),
                    EmbPill(
                      prettyStatus(pickStr(r, ['status'])),
                      color: pickStr(r, ['status']) == 'late' ? EmbTheme.saffron : EmbTheme.mint,
                    ),
                  ],
                ),
              ),
            if (absent.isNotEmpty) ...[
              const EmbSectionTitle('Absent'),
              for (final a in absent)
                EmbCard(
                  child: Row(
                    children: [
                      const Icon(Icons.person_off_outlined, color: EmbTheme.coral, size: 20),
                      const SizedBox(width: 10),
                      Expanded(child: Text(pickStr(a, ['name', 'userName']) ?? 'User', style: embBody(weight: FontWeight.w600))),
                    ],
                  ),
                ),
            ],
            if (records.isEmpty && absent.isEmpty && summary.isEmpty)
              const EmptyState(message: 'No attendance data', icon: Icons.fact_check_outlined),
          ],
        );
      },
    );
  }

  Widget _myCard(Json my, TeamService svc) {
    final canIn = my['canCheckIn'] == true;
    final canOut = my['canCheckOut'] == true;
    return EmbCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('My attendance', style: embBody(size: 16, weight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text(
            canIn
                ? 'You have not checked in today'
                : canOut
                    ? 'Checked in — remember to check out'
                    : 'Done for today',
            style: embBody(size: 13, color: EmbTheme.inkSoft),
          ),
          if (canIn || canOut) const SizedBox(height: 12),
          if (canIn)
            Row(
              children: [
                Expanded(
                  child: FilledButton.icon(
                    style: FilledButton.styleFrom(backgroundColor: EmbTheme.teal),
                    onPressed: _busy ? null : () => _run(() => svc.checkIn(workMode: 'office'), 'Checked in (office)'),
                    icon: const Icon(Icons.business, size: 18),
                    label: const Text('Office'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: FilledButton.icon(
                    style: FilledButton.styleFrom(backgroundColor: EmbTheme.saffron),
                    onPressed: _busy ? null : () => _run(() => svc.checkIn(workMode: 'wfh'), 'Checked in (WFH)'),
                    icon: const Icon(Icons.home_outlined, size: 18),
                    label: const Text('WFH'),
                  ),
                ),
              ],
            ),
          if (canOut)
            EmbPrimaryButton(
              label: 'Check out',
              icon: Icons.logout,
              busy: _busy,
              onPressed: () => _run(svc.checkOut, 'Checked out'),
            ),
        ],
      ),
    );
  }
}
