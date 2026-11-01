import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import '../models/models.dart';
import '../services/local_notify.dart';
import '../services/notification_actions.dart';
import '../services/notifications_api.dart';
import '../services/push_background_service.dart';

/// Real-time CRM notifications via Socket.IO + Android local alerts (with sound).
class NotificationHub extends ChangeNotifier {
  NotificationHub({
    required NotificationsApi api,
    required this.resolveToken,
    required this.resolveApiBase,
  }) : _api = api {
    LocalNotify.instance.onResponse = _onTrayResponse;
  }

  final NotificationsApi _api;
  final String? Function() resolveToken;
  final String Function() resolveApiBase;

  io.Socket? _socket;
  Timer? _poll;
  bool _started = false;
  bool connected = false;
  int unreadCount = 0;
  List<AppNotification> items = [];
  final Set<String> _seenIds = {};

  /// Bumps when a lead-related alert arrives so lists/detail can auto-refresh.
  int leadContentEpoch = 0;

  Future<void> start() async {
    await LocalNotify.instance.init();
    await LocalNotify.instance.ensurePermission();
    LocalNotify.instance.onResponse = _onTrayResponse;
    await PushBackgroundService.setUiForeground(true);
    await PushBackgroundService.startIfLoggedIn();

    if (_started) {
      // Auth rebuilds call start() often — only reconnect if socket is down.
      if (_socket == null || !(connected || (_socket?.connected ?? false))) {
        _connectSocket();
      }
      await consumeLaunchNotification();
      return;
    }

    _started = true;
    await refresh();
    _connectSocket();
    _restartPoll();
    await consumeLaunchNotification();
  }

  Future<void> consumeLaunchNotification() async {
    final resp = await LocalNotify.instance.getLaunchResponse();
    if (resp != null) {
      await _onTrayResponse(resp);
    }
  }

  Future<void> _onTrayResponse(NotificationResponse resp) async {
    await handleNotificationResponse(
      payload: resp.payload,
      actionId: resp.actionId,
      markRead: (id) async {
        if (id.isEmpty) return;
        await markRead(id);
      },
    );
    _bumpLeadEpochIfNeeded(NotificationPayload.tryParse(resp.payload)?.type);
  }

  void _bumpLeadEpochIfNeeded(String? type) {
    final t = (type ?? '').toLowerCase();
    if (t.contains('lead') || t.contains('assign') || t.contains('follow') || t.contains('hot')) {
      leadContentEpoch += 1;
      notifyListeners();
    }
  }

  Future<void> stop() async {
    _started = false;
    _poll?.cancel();
    _poll = null;
    _socket?.dispose();
    _socket = null;
    connected = false;
    unreadCount = 0;
    items = [];
    _seenIds.clear();
    await PushBackgroundService.setUiForeground(false);
    await PushBackgroundService.stop();
    notifyListeners();
  }

  /// Call when app returns to foreground — reconnect + catch missed alerts.
  Future<void> onAppResumed() async {
    if (!_started) return;
    await LocalNotify.instance.ensurePermission();
    await PushBackgroundService.setUiForeground(true);
    await PushBackgroundService.startIfLoggedIn();
    _connectSocket();
    await _pollNew();
  }

  Future<void> onAppPaused() async {
    await PushBackgroundService.setUiForeground(false);
    await PushBackgroundService.startIfLoggedIn();
  }

  void _restartPoll() {
    _poll?.cancel();
    // Faster while socket is down so new leads still alert with sound.
    final every = connected ? const Duration(seconds: 35) : const Duration(seconds: 12);
    _poll = Timer.periodic(every, (_) => _pollNew());
  }

  String _socketOrigin() {
    final api = resolveApiBase();
    if (api.endsWith('/api')) return api.substring(0, api.length - 4);
    final uri = Uri.tryParse(api);
    if (uri == null) return 'https://crm.exploremybharat.info';
    return '${uri.scheme}://${uri.host}${uri.hasPort ? ':${uri.port}' : ''}';
  }

  void _connectSocket() {
    final token = resolveToken();
    if (token == null || token.isEmpty) return;

    _socket?.dispose();
    final origin = _socketOrigin();
    final socket = io.io(
      origin,
      io.OptionBuilder()
          .setPath('/socket.io')
          .setTransports(['websocket', 'polling'])
          .disableAutoConnect()
          .setAuth({'token': token})
          .enableReconnection()
          .setReconnectionDelay(1500)
          .setReconnectionDelayMax(10000)
          .setReconnectionAttempts(999)
          .build(),
    );
    _socket = socket;

    socket.onConnect((_) {
      connected = true;
      _restartPoll();
      notifyListeners();
    });
    socket.onDisconnect((_) {
      connected = false;
      _restartPoll();
      notifyListeners();
    });
    socket.onConnectError((_) {
      connected = false;
      _restartPoll();
      notifyListeners();
    });

    socket.on('notification:new', (data) {
      if (data is Map) {
        _onIncoming(AppNotification.fromJson(Map<String, dynamic>.from(data)), showDevice: true);
      }
    });
    socket.on('notification:unread', (data) {
      if (data is Map) {
        unreadCount = (data['count'] as num?)?.toInt() ?? unreadCount;
        notifyListeners();
      } else if (data is num) {
        unreadCount = data.toInt();
        notifyListeners();
      }
    });
    socket.on('notification:history', (data) {
      if (data is List) {
        final list = data
            .whereType<Map>()
            .map((e) => AppNotification.fromJson(Map<String, dynamic>.from(e)))
            .toList();
        for (final n in list) {
          _seenIds.add(n.id);
        }
        items = list;
        notifyListeners();
      }
    });

    socket.connect();
  }

  Future<void> refresh() async {
    try {
      final result = await _api.fetchList(limit: 50);
      items = result.items;
      for (final n in items) {
        _seenIds.add(n.id);
      }
      unreadCount = await _api.fetchUnreadCount();
      notifyListeners();
    } catch (_) {
      // keep previous state
    }
  }

  Future<void> _pollNew() async {
    if (!_started) return;
    try {
      final result = await _api.fetchList(limit: 20);
      final fresh = <AppNotification>[];
      for (final n in result.items) {
        if (!_seenIds.contains(n.id) && !n.read) {
          fresh.add(n);
        }
        _seenIds.add(n.id);
      }
      if (fresh.isNotEmpty) {
        items = [...fresh, ...items].take(100).toList();
        for (final n in fresh.reversed) {
          await _showDevice(n);
        }
      }
      unreadCount = await _api.fetchUnreadCount();
      notifyListeners();
    } catch (_) {}
  }

  void _onIncoming(AppNotification n, {required bool showDevice}) {
    if (n.id.isEmpty) return;
    if (_seenIds.contains(n.id)) return;
    _seenIds.add(n.id);
    items = [n, ...items].take(100).toList();
    if (!n.read) unreadCount += 1;
    _bumpLeadEpochIfNeeded(n.type);
    notifyListeners();
    if (showDevice) {
      unawaited(_showDevice(n));
    }
  }

  Future<void> _showDevice(AppNotification n) async {
    if (kIsWeb) return;
    await PushBackgroundService.markSeen(n.id);
    final payload = NotificationPayload.fromAppNotification(n);
    final alert = formatLeadDeviceAlert(n);
    await LocalNotify.instance.show(
      id: n.id,
      title: alert.title,
      body: alert.body,
      type: n.type,
      payload: payload.toJsonString(),
      hasPhone: payload.hasPhone,
    );
  }

  Future<void> markRead(String id) async {
    try {
      await _api.markRead(id);
      items = items
          .map((n) => n.id == id
              ? AppNotification(
                  id: n.id,
                  title: n.title,
                  message: n.message,
                  read: true,
                  createdAt: n.createdAt,
                  type: n.type,
                  meta: n.meta,
                )
              : n)
          .toList();
      unreadCount = unreadCount > 0 ? unreadCount - 1 : 0;
      notifyListeners();
    } catch (_) {}
  }

  Future<void> markAllRead() async {
    try {
      await _api.markAllRead();
      items = items
          .map(
            (n) => AppNotification(
              id: n.id,
              title: n.title,
              message: n.message,
              read: true,
              createdAt: n.createdAt,
              type: n.type,
              meta: n.meta,
            ),
          )
          .toList();
      unreadCount = 0;
      notifyListeners();
    } catch (_) {}
  }

  /// Test tone — confirms Android channel + sound works.
  Future<void> sendTestNotification() async {
    await LocalNotify.instance.ensurePermission();
    await LocalNotify.instance.show(
      id: 'test-${DateTime.now().millisecondsSinceEpoch}',
      title: 'Explore My Bharat',
      body: 'Notifications with sound are working.',
      type: 'lead_created',
    );
  }
}
