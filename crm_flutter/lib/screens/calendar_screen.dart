import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../core/emb_theme.dart';
import '../models/models.dart';
import '../providers/auth_provider.dart';
import '../services/followups_service.dart';
import '../widgets/common_widgets.dart' show EmptyState;
import '../widgets/emb_widgets.dart';
import 'lead_detail_screen.dart';

/// Native calendar agenda: follow-ups grouped by date.
class CalendarScreen extends StatefulWidget {
  const CalendarScreen({super.key});

  @override
  State<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends State<CalendarScreen> {
  bool loading = true;
  String? error;
  Map<DateTime, List<FollowUp>> grouped = {};

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final role = context.read<AuthProvider>().user?.role ?? 'sales_executive';
    setState(() {
      loading = true;
      error = null;
    });
    try {
      final items = await context.read<FollowupsService>().fetchForCalendar(role);
      final map = <DateTime, List<FollowUp>>{};
      for (final f in items) {
        final dt = DateTime.tryParse(f.scheduledAt)?.toLocal();
        if (dt == null) continue;
        final day = DateTime(dt.year, dt.month, dt.day);
        map.putIfAbsent(day, () => []).add(f);
      }
      for (final list in map.values) {
        list.sort((a, b) => a.scheduledAt.compareTo(b.scheduledAt));
      }
      if (!mounted) return;
      setState(() {
        grouped = map;
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

  String _dayLabel(DateTime d) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final diff = d.difference(today).inDays;
    if (diff == 0) return 'Today';
    if (diff == 1) return 'Tomorrow';
    if (diff == -1) return 'Yesterday';
    return DateFormat('EEE, dd MMM yyyy').format(d);
  }

  @override
  Widget build(BuildContext context) {
    final days = grouped.keys.toList()..sort();
    return Scaffold(
      backgroundColor: EmbTheme.cream,
      appBar: embAppBar('Calendar'),
      body: loading
          ? const EmbLoading()
          : error != null
              ? EmbErrorView(message: error!, onRetry: _load)
              : RefreshIndicator(
                  color: EmbTheme.teal,
                  onRefresh: _load,
                  child: days.isEmpty
                      ? ListView(children: const [EmptyState(message: 'No scheduled follow-ups', icon: Icons.event_busy)])
                      : ListView(
                          padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                          children: [
                            for (final day in days) ...[
                              Padding(
                                padding: const EdgeInsets.fromLTRB(2, 14, 2, 8),
                                child: Row(
                                  children: [
                                    Text(_dayLabel(day),
                                        style: embBody(size: 16, weight: FontWeight.w800)),
                                    const SizedBox(width: 8),
                                    EmbPill('${grouped[day]!.length}', color: EmbTheme.teal),
                                  ],
                                ),
                              ),
                              for (final f in grouped[day]!) _tile(f),
                            ],
                          ],
                        ),
                ),
    );
  }

  Widget _tile(FollowUp f) {
    final dt = DateTime.tryParse(f.scheduledAt)?.toLocal();
    final done = f.status == 'completed';
    return EmbCard(
      onTap: f.leadId == null
          ? null
          : () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => LeadDetailScreen(leadId: f.leadId!)),
              ),
      child: Row(
        children: [
          Container(
            width: 62,
            padding: const EdgeInsets.symmetric(vertical: 8),
            decoration: BoxDecoration(
              color: done ? EmbTheme.mintSoft : EmbTheme.tealSoft,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              dt == null ? '--' : DateFormat('hh:mm\na').format(dt),
              textAlign: TextAlign.center,
              style: embBody(size: 12, weight: FontWeight.w800, color: done ? EmbTheme.mint : EmbTheme.teal),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(f.leadName ?? 'Lead', style: embBody(size: 15, weight: FontWeight.w700)),
                if (f.destination != null && f.destination!.isNotEmpty)
                  Text(f.destination!, style: embBody(size: 12, color: EmbTheme.inkSoft)),
                if (f.notes != null && f.notes!.isNotEmpty)
                  Text(f.notes!, maxLines: 2, overflow: TextOverflow.ellipsis,
                      style: embBody(size: 12, color: EmbTheme.muted)),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              EmbPill(prettyStatus(f.status ?? 'pending'), color: statusTone(f.status ?? 'pending')),
              if (f.type != null) ...[
                const SizedBox(height: 4),
                Text(prettyStatus(f.type), style: embBody(size: 11, color: EmbTheme.muted)),
              ],
            ],
          ),
        ],
      ),
    );
  }
}
