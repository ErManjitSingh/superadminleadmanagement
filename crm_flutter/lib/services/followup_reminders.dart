import 'package:flutter/foundation.dart';

import '../models/models.dart';
import 'followups_service.dart';
import 'local_notify.dart';

/// Schedules local sound alerts for pending follow-ups at their [scheduledAt] time.
class FollowUpReminders {
  FollowUpReminders._();
  static final instance = FollowUpReminders._();

  static String notifIdFor(String followUpId) => 'fu-$followUpId';

  /// Schedule one follow-up reminder (call after create).
  Future<bool> scheduleOne({
    required String followUpId,
    required DateTime scheduledAt,
    String? leadName,
    String? type,
    String? notes,
    String? leadId,
  }) async {
    if (kIsWeb) return false;
    final title = leadName == null || leadName.isEmpty
        ? 'Follow-up reminder'
        : 'Follow-up: $leadName';
    final parts = <String>[
      if ((type ?? '').isNotEmpty) _pretty(type!),
      if ((notes ?? '').trim().isNotEmpty) notes!.trim(),
      'Tap to open lead',
    ];
    return LocalNotify.instance.scheduleAt(
      id: notifIdFor(followUpId),
      when: scheduledAt,
      title: title,
      body: parts.join(' · '),
      type: 'followup',
      payload: leadId == null || leadId.isEmpty ? 'followup:$followUpId' : 'lead:$leadId',
    );
  }

  Future<void> cancelOne(String followUpId) async {
    if (kIsWeb) return;
    await LocalNotify.instance.cancel(notifIdFor(followUpId));
  }

  /// Pull pending follow-ups (today + upcoming) and schedule sound alerts for each.
  Future<int> syncAll(FollowupsService svc, String role) async {
    if (kIsWeb) return 0;
    await LocalNotify.instance.init();
    var scheduled = 0;
    for (final tab in ['today', 'upcoming']) {
      try {
        final page = await svc.fetchFollowUps(role, tab: tab, limit: 100);
        for (final f in page.items) {
          if (!_isPending(f)) continue;
          final when = DateTime.tryParse(f.scheduledAt);
          if (when == null) continue;
          final ok = await scheduleOne(
            followUpId: f.id,
            scheduledAt: when,
            leadName: f.leadName,
            type: f.type,
            notes: f.notes,
            leadId: f.leadId,
          );
          if (ok) scheduled += 1;
        }
      } catch (_) {}
    }
    return scheduled;
  }

  bool _isPending(FollowUp f) {
    final s = (f.status ?? 'pending').toLowerCase();
    return s == 'pending' || s == 'missed' || s.isEmpty;
  }

  String _pretty(String v) {
    if (v.isEmpty) return v;
    return v[0].toUpperCase() + v.substring(1).replaceAll('_', ' ');
  }
}
