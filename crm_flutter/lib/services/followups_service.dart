import 'package:dio/dio.dart';

import '../core/api_client.dart';
import '../core/roles.dart';
import '../models/models.dart';

class FollowupsService {
  FollowupsService(this._api);
  final ApiClient _api;

  String _base(String role) {
    final prefix = getRoleApiPrefix(role);
    return prefix.isEmpty ? '/followups' : '$prefix/followups';
  }

  /// Prefer role-scoped write routes, then shared `/followups`.
  /// sales_manager / team_leader / admin / executive all have POST now.
  List<String> _writeBases(String role) {
    final roleBase = _base(role);
    if (roleBase == '/followups') return ['/followups'];
    return [roleBase, '/followups'];
  }

  Future<dynamic> _postFirst(List<String> paths, Map<String, dynamic> body) async {
    Object? lastError;
    for (final p in paths) {
      try {
        final res = await _api.post(p, data: body);
        return res.data;
      } catch (e) {
        lastError = e;
        final code = e is DioException ? e.response?.statusCode : null;
        if (code != 404 && code != 403 && code != 405) rethrow;
      }
    }
    throw lastError ?? Exception('Request failed');
  }

  Future<dynamic> _putFirst(List<String> paths, Map<String, dynamic> body) async {
    Object? lastError;
    for (final p in paths) {
      try {
        final res = await _api.put(p, data: body);
        return res.data;
      } catch (e) {
        lastError = e;
        final code = e is DioException ? e.response?.statusCode : null;
        if (code != 404 && code != 403 && code != 405) rethrow;
      }
    }
    throw lastError ?? Exception('Request failed');
  }

  /// Backend tabs: today | upcoming | missed. Completed uses status=completed.
  ({String? tab, String? status}) _resolveListQuery(String? tab) {
    final t = (tab ?? 'today').toLowerCase().trim();
    switch (t) {
      case 'overdue':
      case 'missed':
        return (tab: 'missed', status: null);
      case 'completed':
      case 'done':
        return (tab: null, status: 'completed');
      case 'upcoming':
        return (tab: 'upcoming', status: null);
      case 'today':
        return (tab: 'today', status: null);
      default:
        return (tab: t.isEmpty ? 'today' : t, status: null);
    }
  }

  Future<PaginatedResult<FollowUp>> fetchFollowUps(
    String role, {
    int page = 1,
    int limit = 30,
    String? tab,
    String? status,
  }) async {
    final q = _resolveListQuery(tab);
    final res = await _api.get(
      _base(role),
      queryParameters: {
        'page': page,
        'limit': limit,
        if (q.tab != null) 'tab': q.tab,
        if (status != null || q.status != null) 'status': status ?? q.status,
      },
    );
    final pageData = unwrapPagination(res.data);
    return PaginatedResult(
      items: pageData.items
          .whereType<Map>()
          .map((e) => FollowUp.fromJson(Map<String, dynamic>.from(e)))
          .toList(),
      total: pageData.total,
      page: pageData.page,
      limit: pageData.limit,
    );
  }

  /// Create follow-up (executive → role route, admin → shared).
  /// Returns the created follow-up when the API sends it back.
  Future<FollowUp?> create(
    String role, {
    required String leadId,
    required DateTime scheduledAt,
    String? notes,
    String priority = 'medium',
    String type = 'call',
    String category = 'warm',
  }) async {
    final n = notes?.trim() ?? '';
    final body = <String, dynamic>{
      'leadId': leadId,
      'lead': leadId,
      'scheduledAt': scheduledAt.toUtc().toIso8601String(),
      'priority': priority,
      'type': type,
      'category': category,
      if (n.isNotEmpty) 'notes': n,
      if (n.isNotEmpty) 'remarks': n,
    };
    final data = await _postFirst(_writeBases(role), body);
    if (data is Map) {
      final map = Map<String, dynamic>.from(data);
      final inner = map['followup'] is Map
          ? Map<String, dynamic>.from(map['followup'] as Map)
          : map['followUp'] is Map
              ? Map<String, dynamic>.from(map['followUp'] as Map)
              : map;
      return FollowUp.fromJson(inner);
    }
    return null;
  }

  /// Follow-ups across today / upcoming / overdue tabs, de-duplicated (for calendar).
  Future<List<FollowUp>> fetchForCalendar(String role) async {
    final out = <FollowUp>[];
    for (final tab in ['today', 'upcoming', 'missed']) {
      try {
        final r = await fetchFollowUps(role, limit: 100, tab: tab);
        out.addAll(r.items);
      } catch (_) {}
    }
    final seen = <String>{};
    return out.where((f) => seen.add(f.id)).toList();
  }

  Future<void> complete(String role, String id, {String? remarks}) async {
    final body = <String, dynamic>{
      'action': 'complete',
      'status': 'completed',
      'remarks': (remarks == null || remarks.trim().isEmpty)
          ? 'Follow-up completed'
          : remarks.trim(),
    };
    final paths = _writeBases(role).map((b) => '$b/$id').toList();
    await _putFirst(paths, body);
  }
}
