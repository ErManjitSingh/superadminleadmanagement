import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:ui';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

import '../core/storage.dart';
import '../models/models.dart';
import 'local_notify.dart';
import 'notification_actions.dart';

/// Keeps Socket.IO alive in an Android foreground service so new-lead alerts
/// still fire when the UI is closed / swiped away.
class PushBackgroundService {
  PushBackgroundService._();

  static const _notifId = 7711;
  static const _channelId = 'crm_bg_listen_v1';
  static const _channelName = 'CRM live alerts';
  static const foregroundFlag = 'crm_ui_foreground';
  static const seenIdsKey = 'crm_notif_seen_ids';

  static Future<void> init() async {
    if (kIsWeb) return;

    final service = FlutterBackgroundService();
    final plugin = FlutterLocalNotificationsPlugin();
    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    await plugin.initialize(
      settings: const InitializationSettings(android: androidInit),
    );
    final android = plugin
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
    await android?.createNotificationChannel(
      const AndroidNotificationChannel(
        _channelId,
        _channelName,
        description: 'Keeps CRM connected for new lead alerts',
        importance: Importance.low,
        playSound: false,
        showBadge: false,
      ),
    );

    await service.configure(
      androidConfiguration: AndroidConfiguration(
        onStart: onStart,
        autoStart: false,
        autoStartOnBoot: true,
        isForegroundMode: true,
        notificationChannelId: _channelId,
        initialNotificationTitle: 'Explore My Bharat',
        initialNotificationContent: 'Listening for new leads…',
        foregroundServiceNotificationId: _notifId,
        foregroundServiceTypes: const [AndroidForegroundType.remoteMessaging],
      ),
      iosConfiguration: IosConfiguration(
        autoStart: false,
        onForeground: onStart,
        onBackground: onIosBackground,
      ),
    );
  }

  static Future<void> startIfLoggedIn() async {
    if (kIsWeb) return;
    final token = await AuthStorage().getToken();
    if (token == null || token.isEmpty) {
      await stop();
      return;
    }
    final service = FlutterBackgroundService();
    final running = await service.isRunning();
    if (!running) {
      await service.startService();
    } else {
      service.invoke('reload');
    }
  }

  static Future<void> stop() async {
    if (kIsWeb) return;
    final service = FlutterBackgroundService();
    if (await service.isRunning()) {
      service.invoke('stop');
    }
  }

  static Future<void> setUiForeground(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(foregroundFlag, value);
  }

  /// Returns true if this id was not seen before (and is now recorded).
  static Future<bool> markSeen(String id) async {
    if (id.isEmpty) return false;
    final prefs = await SharedPreferences.getInstance();
    final list = prefs.getStringList(seenIdsKey) ?? <String>[];
    if (list.contains(id)) return false;
    list.insert(0, id);
    while (list.length > 250) {
      list.removeLast();
    }
    await prefs.setStringList(seenIdsKey, list);
    return true;
  }
}

@pragma('vm:entry-point')
Future<bool> onIosBackground(ServiceInstance service) async {
  WidgetsFlutterBinding.ensureInitialized();
  DartPluginRegistrant.ensureInitialized();
  return true;
}

@pragma('vm:entry-point')
void onStart(ServiceInstance service) async {
  DartPluginRegistrant.ensureInitialized();

  Timer? poll;
  io.Socket? socket;
  var connecting = false;

  Future<void> disconnectSocket() async {
    socket?.dispose();
    socket = null;
  }

  Future<void> showAlert(Map data) async {
    final id = '${data['id'] ?? data['_id'] ?? ''}';
    final title = '${data['title'] ?? 'Explore My Bharat'}';
    final body = '${data['message'] ?? data['body'] ?? ''}';
    final type = '${data['type'] ?? ''}';
    if (id.isEmpty && title.isEmpty) return;

    final key = id.isEmpty ? '$title|$body' : id;
    final isNew = await PushBackgroundService.markSeen(key);
    if (!isNew) return;

    final prefs = await SharedPreferences.getInstance();
    if (prefs.getBool(PushBackgroundService.foregroundFlag) == true) {
      // UI NotificationHub shows the sound alert while app is open.
      return;
    }

    final meta = data['meta'] is Map
        ? Map<String, dynamic>.from(data['meta'] as Map)
        : Map<String, dynamic>.from(data);
    final n = AppNotification(
      id: id.isEmpty ? 'bg-${DateTime.now().millisecondsSinceEpoch}' : id,
      title: title,
      message: body,
      read: false,
      createdAt: '',
      type: type,
      meta: meta,
    );
    final payload = NotificationPayload.fromAppNotification(n);
    final alert = formatLeadDeviceAlert(n);
    await LocalNotify.instance.init();
    await LocalNotify.instance.show(
      id: n.id,
      title: alert.title,
      body: alert.body,
      type: type,
      payload: payload.toJsonString(),
      hasPhone: payload.hasPhone,
    );
  }

  Future<void> connectSocket() async {
    if (connecting) return;
    connecting = true;
    try {
      await disconnectSocket();
      final storage = AuthStorage();
      final token = await storage.getToken();
      if (token == null || token.isEmpty) {
        service.stopSelf();
        return;
      }
      final api = (await storage.getApiUrl())?.trim();
      final apiBase =
          (api == null || api.isEmpty) ? 'https://crm.exploremybharat.info/api' : api;
      String origin;
      if (apiBase.endsWith('/api')) {
        origin = apiBase.substring(0, apiBase.length - 4);
      } else {
        final u = Uri.tryParse(apiBase);
        origin = u == null
            ? 'https://crm.exploremybharat.info'
            : '${u.scheme}://${u.host}${u.hasPort ? ':${u.port}' : ''}';
      }

      final s = io.io(
        origin,
        io.OptionBuilder()
            .setPath('/socket.io')
            .setTransports(['websocket', 'polling'])
            .disableAutoConnect()
            .setAuth({'token': token})
            .enableReconnection()
            .setReconnectionDelay(2000)
            .setReconnectionDelayMax(15000)
            .setReconnectionAttempts(999)
            .build(),
      );
      socket = s;
      s.on('notification:new', (data) {
        if (data is Map) {
          unawaited(showAlert(Map<String, dynamic>.from(data)));
        }
      });
      s.onConnect((_) {
        if (service is AndroidServiceInstance) {
          service.setForegroundNotificationInfo(
            title: 'Explore My Bharat',
            content: 'Connected — new leads will alert you',
          );
        }
      });
      s.onDisconnect((_) {
        if (service is AndroidServiceInstance) {
          service.setForegroundNotificationInfo(
            title: 'Explore My Bharat',
            content: 'Reconnecting for lead alerts…',
          );
        }
      });
      s.connect();
    } finally {
      connecting = false;
    }
  }

  if (service is AndroidServiceInstance) {
    await service.setAsForegroundService();
  }

  service.on('stop').listen((_) async {
    poll?.cancel();
    await disconnectSocket();
    service.stopSelf();
  });
  service.on('reload').listen((_) => connectSocket());

  await LocalNotify.instance.init();
  await connectSocket();

  poll = Timer.periodic(const Duration(seconds: 45), (_) async {
    if (socket?.connected != true) {
      await connectSocket();
    }
    await _pollNotifications(showAlert);
  });
}

Future<void> _pollNotifications(Future<void> Function(Map data) showAlert) async {
  try {
    final storage = AuthStorage();
    final token = await storage.getToken();
    if (token == null || token.isEmpty) return;
    final api = (await storage.getApiUrl())?.trim();
    final base =
        (api == null || api.isEmpty) ? 'https://crm.exploremybharat.info/api' : api;

    final uri = Uri.parse('$base/notifications').replace(queryParameters: {'limit': '20'});
    final client = HttpClient();
    try {
      final req = await client.getUrl(uri);
      req.headers.set('Authorization', 'Bearer $token');
      req.headers.set('Accept', 'application/json');
      final res = await req.close().timeout(const Duration(seconds: 25));
      if (res.statusCode != 200) return;
      final body = await res.transform(utf8.decoder).join();
      final decoded = jsonDecode(body);
      final List list;
      if (decoded is Map && decoded['data'] is List) {
        list = decoded['data'] as List;
      } else if (decoded is List) {
        list = decoded;
      } else {
        return;
      }
      for (final item in list.reversed) {
        if (item is Map) {
          final map = Map<String, dynamic>.from(item);
          if (map['read'] == true) continue;
          await showAlert(map);
        }
      }
    } finally {
      client.close(force: true);
    }
  } catch (_) {}
}
