import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/models.dart';
import '../screens/lead_detail_screen.dart';

/// Global nav key — used when user taps a system tray notification.
final GlobalKey<NavigatorState> crmNavigatorKey = GlobalKey<NavigatorState>();

const kActionOpen = 'open_lead';
const kActionCall = 'call_lead';
const kActionWhatsapp = 'wa_lead';

class NotificationPayload {
  const NotificationPayload({
    this.notificationId,
    this.leadId,
    this.leadName,
    this.phone,
    this.type,
  });

  final String? notificationId;
  final String? leadId;
  final String? leadName;
  final String? phone;
  final String? type;

  bool get hasLead => leadId != null && leadId!.isNotEmpty;
  bool get hasPhone => phone != null && phone!.trim().isNotEmpty;

  String toJsonString() => jsonEncode({
        if (notificationId != null) 'id': notificationId,
        if (leadId != null) 'leadId': leadId,
        if (leadName != null) 'leadName': leadName,
        if (phone != null) 'phone': phone,
        if (type != null) 'type': type,
      });

  static NotificationPayload? tryParse(String? raw) {
    if (raw == null || raw.trim().isEmpty) return null;
    final t = raw.trim();
    if (t.startsWith('{')) {
      try {
        final m = jsonDecode(t);
        if (m is Map) {
          return NotificationPayload(
            notificationId: '${m['id'] ?? m['notificationId'] ?? ''}'.nullIfEmpty,
            leadId: '${m['leadId'] ?? m['lead'] ?? ''}'.nullIfEmpty,
            leadName: '${m['leadName'] ?? m['name'] ?? ''}'.nullIfEmpty,
            phone: '${m['phone'] ?? m['whatsapp'] ?? ''}'.nullIfEmpty,
            type: '${m['type'] ?? ''}'.nullIfEmpty,
          );
        }
      } catch (_) {}
    }
    // Legacy: bare notification id or lead id
    return NotificationPayload(notificationId: t);
  }

  static NotificationPayload fromAppNotification(AppNotification n) {
    final meta = n.meta ?? const <String, dynamic>{};
    final leadId = '${meta['leadId'] ?? meta['lead'] ?? meta['_id'] ?? ''}'.nullIfEmpty;
    final name = '${meta['leadName'] ?? meta['name'] ?? ''}'.nullIfEmpty;
    final phone = '${meta['phone'] ?? meta['whatsapp'] ?? ''}'.nullIfEmpty;
    return NotificationPayload(
      notificationId: n.id,
      leadId: leadId,
      leadName: name,
      phone: phone,
      type: n.type,
    );
  }
}

extension on String {
  String? get nullIfEmpty => trim().isEmpty ? null : this;
}

String digitsOnly(String phone) => phone.replaceAll(RegExp(r'[^\d+]'), '');

Future<void> launchCall(String phone) async {
  final p = phone.trim();
  if (p.isEmpty) return;
  await launchUrl(Uri.parse('tel:$p'), mode: LaunchMode.externalApplication);
}

Future<void> launchWhatsApp(String phone) async {
  final digits = digitsOnly(phone);
  if (digits.isEmpty) return;
  await launchUrl(Uri.parse('https://wa.me/$digits'), mode: LaunchMode.externalApplication);
}

Future<void> openLeadFromNotification(String leadId) async {
  final nav = crmNavigatorKey.currentState;
  if (nav == null || leadId.isEmpty) return;
  await nav.push(
    MaterialPageRoute(
      builder: (_) => LeadDetailScreen(
        key: ValueKey('notif-lead-$leadId-${DateTime.now().millisecondsSinceEpoch}'),
        leadId: leadId,
      ),
    ),
  );
}

/// Handle tray tap / action button. Returns true if something was handled.
Future<bool> handleNotificationResponse({
  required String? payload,
  String? actionId,
  Future<void> Function(String notificationId)? markRead,
}) async {
  final data = NotificationPayload.tryParse(payload);
  if (data == null) return false;

  if (data.notificationId != null && markRead != null) {
    try {
      await markRead(data.notificationId!);
    } catch (_) {}
  }

  final action = (actionId == null || actionId.isEmpty || actionId == 'default')
      ? kActionOpen
      : actionId;

  if (action == kActionCall && data.hasPhone) {
    await launchCall(data.phone!);
    return true;
  }
  if (action == kActionWhatsapp && data.hasPhone) {
    await launchWhatsApp(data.phone!);
    return true;
  }
  if (data.hasLead) {
    await openLeadFromNotification(data.leadId!);
    return true;
  }
  return false;
}

/// Build tray title/body for lead alerts (name + phone).
({String title, String body}) formatLeadDeviceAlert(AppNotification n) {
  final p = NotificationPayload.fromAppNotification(n);
  final name = p.leadName ?? '';
  final phone = p.phone ?? '';
  final type = (n.type ?? '').toLowerCase();

  String title;
  if (type.contains('assign')) {
    title = name.isNotEmpty ? 'Lead assigned: $name' : n.title;
  } else if (type.contains('created') || type.contains('lead')) {
    title = name.isNotEmpty ? 'New lead: $name' : n.title;
  } else {
    title = name.isNotEmpty ? '$name · ${n.title}' : n.title;
  }

  final parts = <String>[
    if (phone.isNotEmpty) '📞 $phone',
    if ((n.message ?? '').trim().isNotEmpty) n.message!.trim(),
    if (isLeadLike(type)) 'Call · WhatsApp · Open lead',
  ];
  // Dedupe if message already has phone/name
  final seen = <String>{};
  final body = parts
      .where((s) => s.isNotEmpty && seen.add(s.toLowerCase()))
      .join('\n');
  return (title: title, body: body.isEmpty ? (n.message ?? title) : body);
}

bool isLeadLike(String type) {
  final t = type.toLowerCase();
  return t.contains('lead') || t.contains('assign') || t.contains('hot') || t.contains('sla') || t.contains('follow');
}
