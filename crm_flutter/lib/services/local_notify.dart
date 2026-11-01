import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest_all.dart' as tzdata;
import 'package:timezone/timezone.dart' as tz;

import 'notification_actions.dart';

/// Android local notifications with sound + vibration channels.
class LocalNotify {
  LocalNotify._();
  static final instance = LocalNotify._();

  final FlutterLocalNotificationsPlugin _plugin = FlutterLocalNotificationsPlugin();
  bool _ready = false;
  bool _tzReady = false;
  bool? _permissionGranted;

  /// Fired when user taps the notification or an action button.
  void Function(NotificationResponse response)? onResponse;

  /// v2 channel ids — Android never updates sound/importance on existing channels.
  static const androidChannels = <AndroidNotificationChannel>[
    AndroidNotificationChannel(
      'crm_default_v2',
      'CRM Alerts',
      description: 'General CRM notifications with sound',
      importance: Importance.max,
      playSound: true,
      enableVibration: true,
      showBadge: true,
    ),
    AndroidNotificationChannel(
      'crm_leads_v2',
      'New Leads',
      description: 'New lead assignments and hot lead alerts',
      importance: Importance.max,
      playSound: true,
      enableVibration: true,
      showBadge: true,
    ),
    AndroidNotificationChannel(
      'crm_followups_v2',
      'Follow-ups',
      description: 'Scheduled follow-up reminders with sound',
      importance: Importance.max,
      playSound: true,
      enableVibration: true,
      showBadge: true,
    ),
    AndroidNotificationChannel(
      'crm_quotations_v2',
      'Quotations',
      description: 'Quote sent, approved or rejected updates',
      importance: Importance.max,
      playSound: true,
      enableVibration: true,
      showBadge: true,
    ),
  ];

  Future<void> init() async {
    if (_ready) return;

    _ensureTimeZones();

    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosInit = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    await _plugin.initialize(
      settings: const InitializationSettings(android: androidInit, iOS: iosInit),
      onDidReceiveNotificationResponse: (resp) => onResponse?.call(resp),
      onDidReceiveBackgroundNotificationResponse: notificationTapBackground,
    );

    if (!kIsWeb) {
      final android = _plugin.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
      if (android != null) {
        for (final ch in androidChannels) {
          await android.createNotificationChannel(ch);
        }
      }
    }

    _ready = true;
  }

  /// Call when Activity is ready (after login). Android 13+ needs runtime grant.
  Future<bool> ensurePermission() async {
    await init();
    if (kIsWeb) return true;

    final android = _plugin.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
    if (android != null) {
      final enabled = await android.areNotificationsEnabled();
      if (enabled == true) {
        _permissionGranted = true;
        return true;
      }
      final granted = await android.requestNotificationsPermission();
      _permissionGranted = granted == true;
      try {
        await android.requestExactAlarmsPermission();
      } catch (_) {}
      return _permissionGranted == true;
    }

    final ios = _plugin.resolvePlatformSpecificImplementation<IOSFlutterLocalNotificationsPlugin>();
    if (ios != null) {
      final granted = await ios.requestPermissions(alert: true, badge: true, sound: true);
      _permissionGranted = granted == true;
      return _permissionGranted == true;
    }

    return true;
  }

  bool get permissionGranted => _permissionGranted == true;

  void _ensureTimeZones() {
    if (_tzReady) return;
    tzdata.initializeTimeZones();
    try {
      tz.setLocalLocation(tz.getLocation('Asia/Kolkata'));
    } catch (_) {
      tz.setLocalLocation(tz.UTC);
    }
    _tzReady = true;
  }

  String channelForType(String? type) {
    final t = (type ?? '').toLowerCase();
    if (t.contains('lead') || t.contains('assign') || t.contains('hot') || t.contains('sla')) {
      return 'crm_leads_v2';
    }
    if (t.contains('follow')) return 'crm_followups_v2';
    if (t.contains('quot') || t.contains('payment') || t.contains('booking')) {
      return 'crm_quotations_v2';
    }
    return 'crm_default_v2';
  }

  int _notifId(String id) => id.hashCode & 0x7fffffff;

  AndroidNotificationDetails _androidDetails({
    required String channelId,
    required String channelName,
    required String? channelDescription,
    required String body,
    required String title,
    List<AndroidNotificationAction>? actions,
  }) {
    return AndroidNotificationDetails(
      channelId,
      channelName,
      channelDescription: channelDescription,
      importance: Importance.max,
      priority: Priority.high,
      playSound: true,
      enableVibration: true,
      category: AndroidNotificationCategory.message,
      visibility: NotificationVisibility.public,
      ticker: title,
      styleInformation: BigTextStyleInformation(body.isEmpty ? title : body),
      actions: actions,
      autoCancel: true,
    );
  }

  List<AndroidNotificationAction>? _actionsFor({required String? type, required bool hasPhone}) {
    final t = (type ?? '').toLowerCase();
    final isLead = t.contains('lead') || t.contains('assign') || t.contains('hot') || t.contains('sla');
    if (!isLead) return null;
    return [
      const AndroidNotificationAction(kActionOpen, 'Open lead', showsUserInterface: true),
      if (hasPhone) const AndroidNotificationAction(kActionCall, 'Call', showsUserInterface: true),
      if (hasPhone) const AndroidNotificationAction(kActionWhatsapp, 'WhatsApp', showsUserInterface: true),
    ];
  }

  Future<void> show({
    required String id,
    required String title,
    String? body,
    String? type,
    String? payload,
    bool hasPhone = false,
  }) async {
    if (kIsWeb) return;
    await init();
    await ensurePermission();
    final channelId = channelForType(type);
    final channel = androidChannels.firstWhere((c) => c.id == channelId, orElse: () => androidChannels.first);
    final text = body ?? '';
    await _plugin.show(
      id: _notifId(id),
      title: title,
      body: body,
      notificationDetails: NotificationDetails(
        android: _androidDetails(
          channelId: channelId,
          channelName: channel.name,
          channelDescription: channel.description,
          body: text,
          title: title,
          actions: _actionsFor(type: type, hasPhone: hasPhone),
        ),
        iOS: const DarwinNotificationDetails(
          presentAlert: true,
          presentBadge: true,
          presentSound: true,
        ),
      ),
      payload: payload ?? id,
    );
  }

  /// If the app was launched by tapping a notification while killed.
  Future<NotificationResponse?> getLaunchResponse() async {
    await init();
    final details = await _plugin.getNotificationAppLaunchDetails();
    if (details?.didNotificationLaunchApp == true) {
      return details!.notificationResponse;
    }
    return null;
  }

  /// Schedule a one-shot notification at [when] (local time) with sound.
  Future<bool> scheduleAt({
    required String id,
    required DateTime when,
    required String title,
    String? body,
    String? type,
    String? payload,
  }) async {
    if (kIsWeb) return false;
    await init();
    await ensurePermission();
    final localWhen = when.isUtc ? when.toLocal() : when;
    if (!localWhen.isAfter(DateTime.now().add(const Duration(seconds: 5)))) {
      return false;
    }

    final channelId = channelForType(type);
    final channel = androidChannels.firstWhere((c) => c.id == channelId, orElse: () => androidChannels.first);
    final text = body ?? '';
    final tzWhen = tz.TZDateTime(
      tz.local,
      localWhen.year,
      localWhen.month,
      localWhen.day,
      localWhen.hour,
      localWhen.minute,
      localWhen.second,
    );

    final details = NotificationDetails(
      android: _androidDetails(
        channelId: channelId,
        channelName: channel.name,
        channelDescription: channel.description,
        body: text,
        title: title,
      ),
      iOS: const DarwinNotificationDetails(
        presentAlert: true,
        presentBadge: true,
        presentSound: true,
      ),
    );

    try {
      await _plugin.zonedSchedule(
        id: _notifId(id),
        title: title,
        body: body,
        scheduledDate: tzWhen,
        notificationDetails: details,
        androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
        payload: payload ?? id,
      );
      return true;
    } catch (_) {
      try {
        await _plugin.zonedSchedule(
          id: _notifId(id),
          title: title,
          body: body,
          scheduledDate: tzWhen,
          notificationDetails: details,
          androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
          payload: payload ?? id,
        );
        return true;
      } catch (_) {
        return false;
      }
    }
  }

  Future<void> cancel(String id) async {
    if (kIsWeb) return;
    await init();
    await _plugin.cancel(id: _notifId(id));
  }

  Future<void> cancelAll() async {
    if (kIsWeb) return;
    await init();
    await _plugin.cancelAll();
  }
}

@pragma('vm:entry-point')
void notificationTapBackground(NotificationResponse response) {
  // Foreground handler also runs when UI is up; this covers killed/background taps.
  // Call / WhatsApp can be launched without UI; open-lead is handled after resume.
  final action = response.actionId;
  final data = NotificationPayload.tryParse(response.payload);
  if (data == null) return;
  if (action == kActionCall && data.hasPhone) {
    unawaited(launchCall(data.phone!));
  } else if (action == kActionWhatsapp && data.hasPhone) {
    unawaited(launchWhatsApp(data.phone!));
  }
}
