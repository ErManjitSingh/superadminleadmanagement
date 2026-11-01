import 'package:dio/dio.dart';

import '../core/api_client.dart';
import '../core/roles.dart';
import '../models/models.dart';
import 'service_utils.dart';

class LeadsService {
  LeadsService(this._api);
  final ApiClient _api;

  String _leadsPath(String role, [String suffix = '']) {
    final prefix = getRoleApiPrefix(role);
    if (prefix.isEmpty) return '/leads$suffix';
    return '$prefix/leads$suffix';
  }

  /// Role-prefixed path first (if the role has one), then the shared `/leads` route.
  List<String> _rolePaths(String role, String suffix) {
    final prefix = getRoleApiPrefix(role);
    return [
      if (prefix.isNotEmpty) '$prefix/leads$suffix',
      '/leads$suffix',
    ];
  }

  /// Shared `/leads` route first, then the role-prefixed one.
  List<String> _sharedFirstPaths(String role, String suffix) =>
      _rolePaths(role, suffix).reversed.toList();

  Future<dynamic> _getFirst(
    List<String> paths, {
    Map<String, dynamic>? query,
  }) async {
    Object? lastError;
    for (final p in paths) {
      try {
        final res = await _api.get(p, queryParameters: query);
        return res.data;
      } catch (e) {
        lastError = e;
      }
    }
    throw lastError ?? Exception('Request failed');
  }

  Future<dynamic> _postFirst(List<String> paths, Map<String, dynamic> body) async {
    Object? lastError;
    for (final p in paths) {
      try {
        final res = await _api.post(p, data: body);
        return res.data;
      } catch (e) {
        lastError = e;
        // Only fall through to the next route when this one doesn't exist / isn't allowed.
        final code = e is DioException ? e.response?.statusCode : null;
        if (code != 404 && code != 403 && code != 405) rethrow;
      }
    }
    throw lastError ?? Exception('Request failed');
  }

  Future<DashboardData> fetchDashboard(String role) async {
    final prefix = getRoleApiPrefix(role);
    final path = prefix.isEmpty ? '/dashboard/stats' : '$prefix/dashboard';
    final res = await _api.get(path);
    final data = res.data is Map ? Map<String, dynamic>.from(res.data as Map) : <String, dynamic>{};
    return DashboardData.fromJson(data);
  }

  /// Shared `/leads` uses `status`; role routes use `filter` (+ optional `status`).
  String? _statusForFilter(String role, String? filter) {
    if (filter == null || filter == 'all' || filter == 'today') return null;
    if (filter == 'reactivated') return 'reactivated';
    if (role == 'sales_executive') return null;
    switch (filter) {
      case 'new':
      case 'contacted':
      case 'converted':
      case 'lost':
        return filter;
      case 'follow-up':
        return 'follow_up';
      default:
        return null;
    }
  }

  Map<String, dynamic> _leadListParams({
    required String role,
    required int page,
    required int limit,
    String? filter,
    String? search,
  }) {
    final q = <String, dynamic>{'page': page, 'limit': limit};
    if (search != null && search.isNotEmpty) q['search'] = search;
    if (filter == null || filter == 'all') return q;

    if (filter == 'today') {
      final now = DateTime.now();
      final start = DateTime(now.year, now.month, now.day);
      final end = DateTime(now.year, now.month, now.day, 23, 59, 59, 999);
      q['dateFrom'] = start.toIso8601String();
      q['dateTo'] = end.toIso8601String();
      return q;
    }

    q['filter'] = filter;
    final status = _statusForFilter(role, filter);
    if (status != null) q['status'] = status;
    return q;
  }

  Future<PaginatedResult<Lead>> fetchLeads(
    String role, {
    int page = 1,
    int limit = 20,
    String? filter,
    String? search,
  }) async {
    final res = await _api.get(
      _leadsPath(role),
      queryParameters: _leadListParams(
        role: role,
        page: page,
        limit: limit,
        filter: filter,
        search: search,
      ),
    );
    final pageData = unwrapPagination(res.data);
    return PaginatedResult(
      items: pageData.items
          .whereType<Map>()
          .map((e) => Lead.fromJson(Map<String, dynamic>.from(e)))
          .toList(),
      total: pageData.total,
      page: pageData.page,
      limit: pageData.limit,
    );
  }

  /// GET lead detail. Pass [includeRelated] to embed followups + quotations (backend supports it).
  Future<Lead> fetchLeadDetail(String role, String id, {bool includeRelated = false}) async {
    final res = await _api.get(
      _leadsPath(role, '/$id'),
      queryParameters: includeRelated ? {'includeRelated': 'true'} : null,
    );
    final data = res.data;
    if (data is Map && data['lead'] is Map) {
      return Lead.fromJson(Map<String, dynamic>.from(data['lead'] as Map));
    }
    return Lead.fromJson(Map<String, dynamic>.from(data as Map));
  }

  /// POST /leads (shared route — executives/manager/admin all use it; requires leads.create).
  Future<Lead> createLead(Map<String, dynamic> payload) async {
    final res = await _api.post('/leads', data: payload);
    final data = res.data;
    if (data is Map) {
      final inner = data['lead'] is Map ? data['lead'] as Map : data;
      return Lead.fromJson(Map<String, dynamic>.from(inner));
    }
    throw Exception('Invalid response from server');
  }

  /// PUT lead. Sales managers have no role-scoped PUT, so they use shared /leads/:id.
  Future<Lead> updateLead(String role, String id, Map<String, dynamic> payload) async {
    final path = role == 'sales_manager' ? '/leads/$id' : _leadsPath(role, '/$id');
    final res = await _api.put(path, data: payload);
    final data = res.data;
    if (data is Map) {
      final inner = data['lead'] is Map ? data['lead'] as Map : data;
      return Lead.fromJson(Map<String, dynamic>.from(inner));
    }
    throw Exception('Invalid response from server');
  }

  /// GET /leads/assignees -> { salesManagers, teamLeaders, salesExecutives }.
  Future<List<Assignee>> fetchAssignees() async {
    final res = await _api.get('/leads/assignees');
    final data = res.data is Map ? res.data as Map : const {};
    List<Assignee> parse(String key, String role) {
      final raw = data[key];
      if (raw is! List) return [];
      return raw
          .whereType<Map>()
          .map((e) => Assignee.fromJson(Map<String, dynamic>.from(e), role))
          .toList();
    }

    return [
      ...parse('salesExecutives', 'sales_executive'),
      ...parse('teamLeaders', 'team_leader'),
      ...parse('salesManagers', 'sales_manager'),
    ];
  }

  /// POST /leads/assign { leadIds, assigneeRole, assigneeId } (admin/sales_manager/team_leader).
  Future<void> assignLeads({
    required List<String> leadIds,
    required String assigneeRole,
    required String assigneeId,
  }) async {
    await _api.post('/leads/assign', data: {
      'leadIds': leadIds,
      'assigneeRole': assigneeRole,
      'assigneeId': assigneeId,
    });
  }

  /// PUT status (+ optional reason). Sales managers have no role-scoped PUT, so they use /leads/:id.
  Future<void> updateLeadStatus(String role, String id, String status, {String? reason}) async {
    final path = role == 'sales_manager' ? '/leads/$id' : _leadsPath(role, '/$id');
    await _api.put(path, data: {
      'status': status,
      if (reason != null && reason.trim().isNotEmpty) 'statusReason': reason.trim(),
    });
  }

  /// POST note. Executives have a role route; everyone else uses shared /leads/:id/notes.
  Future<void> addNote(String role, String id, String content) async {
    final body = {'text': content, 'content': content};
    await _postFirst(_rolePaths(role, '/$id/notes'), body);
  }

  Future<List<Map<String, dynamic>>> fetchNotes(String role, String id) async {
    final data = await _getFirst(_rolePaths(role, '/$id/notes-list'), query: {'page': 1, 'limit': 50});
    return asMapList(data, const ['notes']);
  }

  // ---------------------------------------------------------------------------
  // Lead 360 related data
  // ---------------------------------------------------------------------------

  /// GET /leads/:id/timeline -> { data: [...], pagination }.
  Future<List<Map<String, dynamic>>> fetchTimeline(String role, String id, {int limit = 50}) async {
    final data = await _getFirst(
      _sharedFirstPaths(role, '/$id/timeline'),
      query: {'page': 1, 'limit': limit},
    );
    return asMapList(data);
  }

  /// GET .../leads/:id/quotations (role route, falls back to shared).
  Future<List<Quotation>> fetchLeadQuotations(String role, String id) async {
    final data = await _getFirst(
      _rolePaths(role, '/$id/quotations'),
      query: {'page': 1, 'limit': 50},
    );
    return asMapList(data, const ['quotations'])
        .map(Quotation.fromJson)
        .toList();
  }

  /// GET /leads/:id/followups -> { followups: [...] }.
  Future<List<FollowUp>> fetchFollowupsForLead(String role, String id) async {
    final data = await _getFirst(
      _sharedFirstPaths(role, '/$id/followups'),
      query: {'page': 1, 'limit': 50},
    );
    return asMapList(data, const ['followups', 'followUps'])
        .map(FollowUp.fromJson)
        .toList();
  }

  /// GET .../leads/:id/email-history (role route, fallback /leads/:id/email-history).
  Future<List<Map<String, dynamic>>> fetchEmailHistory(String role, String id) async {
    final data = await _getFirst(_rolePaths(role, '/$id/email-history'), query: {'limit': 30});
    return asMapList(data, const ['history', 'emails']);
  }

  /// GET /leads/:id/transfer-history -> { data: [...] }.
  Future<List<Map<String, dynamic>>> fetchTransferHistory(String role, String id) async {
    final data = await _getFirst(_sharedFirstPaths(role, '/$id/transfer-history'));
    return asMapList(data);
  }

  /// GET /leads/:id/audit -> { data: [...] } (admin + sales_manager only).
  Future<List<Map<String, dynamic>>> fetchAudit(String role, String id) async {
    final data = await _getFirst(
      _sharedFirstPaths(role, '/$id/audit'),
      query: {'page': 1, 'limit': 30},
    );
    return asMapList(data);
  }

  /// GET /booking-payments/leads/:id/booking -> { booking, advancePayment }.
  Future<Map<String, dynamic>> fetchBookingForLead(String id) async {
    final res = await _api.get('/booking-payments/leads/$id/booking');
    return asMap(res.data);
  }

  /// GET /booking-payments/leads/:id/convert-preview.
  Future<Map<String, dynamic>> fetchConvertPreview(String id) async {
    final res = await _api.get('/booking-payments/leads/$id/convert-preview');
    return asMap(res.data);
  }

  /// POST /booking-payments/leads/:id/convert-with-payment.
  Future<Map<String, dynamic>> convertLeadWithPayment(String id, Map<String, dynamic> payload) async {
    final res = await _api.post('/booking-payments/leads/$id/convert-with-payment', data: payload);
    return asMap(res.data);
  }

  /// POST /leads/:id/call-notes { outcome, notes, duration }.
  Future<void> addCallNote(
    String role,
    String id, {
    required String outcome,
    required String notes,
    int duration = 0,
  }) async {
    await _postFirst(_sharedFirstPaths(role, '/$id/call-notes'), {
      'outcome': outcome,
      'notes': notes,
      'duration': duration,
    });
  }

  /// POST /leads/:id/whatsapp-contact — logs that WhatsApp was initiated.
  Future<Map<String, dynamic>> logWhatsappContact(String role, String id, {String? templateId}) async {
    final data = await _postFirst(
      _sharedFirstPaths(role, '/$id/whatsapp-contact'),
      {'templateId': ?templateId},
    );
    return asMap(data);
  }

  /// POST /leads/:id/send-email { to, subject, message }.
  Future<void> sendLeadEmail(
    String role,
    String id, {
    required String to,
    required String subject,
    required String message,
  }) async {
    await _postFirst(_rolePaths(role, '/$id/send-email'), {
      'to': to,
      'subject': subject,
      'message': message,
      'category': 'custom',
    });
  }

  /// POST /leads/:id/reactivate { reason, executiveId? } (admin / manager / team leader).
  Future<void> reactivateLead(String role, String id, {required String reason, String? executiveId}) async {
    await _postFirst(_sharedFirstPaths(role, '/$id/reactivate'), {
      'reason': reason,
      'executiveId': ?executiveId,
    });
  }

  Future<PaginatedResult<AppNotification>> fetchNotifications(String role) async {
    final prefix = getRoleApiPrefix(role);
    final path = prefix.isEmpty ? '/notifications' : '$prefix/notifications';
    final res = await _api.get(path, queryParameters: {'page': 1, 'limit': 30});
    final pageData = unwrapPagination(res.data);
    return PaginatedResult(
      items: pageData.items
          .whereType<Map>()
          .map((e) => AppNotification.fromJson(Map<String, dynamic>.from(e)))
          .toList(),
      total: pageData.total,
      page: pageData.page,
      limit: pageData.limit,
    );
  }
}
