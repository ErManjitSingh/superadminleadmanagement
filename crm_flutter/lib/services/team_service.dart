import '../core/api_client.dart';
import 'service_utils.dart';

/// Users, teams, attendance, team performance and team-leader escalations.
class TeamService {
  TeamService(this._api);
  final ApiClient _api;

  // ── Users ────────────────────────────────────────────────────────────────
  Future<List<Json>> fetchUsers({String? search, String? status, int limit = 100}) async {
    final res = await _api.get('/users', queryParameters: {
      'page': 1,
      'limit': limit,
      if (search != null && search.isNotEmpty) 'search': search,
      if (status != null && status.isNotEmpty) 'status': status,
    });
    return asMapList(res.data, ['users']);
  }

  Future<Json> fetchUser(String id) async {
    final res = await _api.get('/users/$id');
    return asMap(res.data);
  }

  // ── Teams (sales manager) ────────────────────────────────────────────────
  Future<List<Json>> fetchTeams() async {
    final res = await _api.get('/teams');
    return asMapList(res.data, ['teams']);
  }

  Future<List<Json>> fetchTeamLeaders() async {
    final res = await _api.get('/teams/leaders');
    return asMapList(res.data, ['leaders']);
  }

  Future<List<Json>> fetchAvailableExecutives() async {
    final res = await _api.get('/teams/available-executives');
    return asMapList(res.data, ['executives']);
  }

  Future<void> createTeam({
    required String name,
    required String teamLeaderId,
    String description = '',
  }) async {
    await _api.post('/teams', data: {
      'name': name,
      'description': description,
      'teamLeaderId': teamLeaderId,
    });
  }

  Future<void> addMember(String teamId, String executiveId) =>
      _api.post('/teams/$teamId/members', data: {'executiveId': executiveId});

  Future<void> removeMember(String teamId, String memberId) =>
      _api.delete('/teams/$teamId/members/$memberId');

  Future<void> deleteTeam(String teamId) => _api.delete('/teams/$teamId');

  /// GET /team/performance
  Future<Json> fetchPerformance() async {
    final res = await _api.get('/team/performance');
    return res.data is Map ? asMap(res.data) : {'items': asMapList(res.data)};
  }

  // ── Attendance ───────────────────────────────────────────────────────────
  /// GET /attendance/today (or /summary with a range) → role-scoped summary.
  Future<Json> fetchAttendanceSummary({String? from, String? to}) async {
    final res = await _api.get(
      from == null ? '/attendance/today' : '/attendance/summary',
      queryParameters: from == null ? null : {'from': from, 'to': ?to},
    );
    return asMap(res.data);
  }

  Future<Json> fetchMyAttendanceStatus() async {
    final res = await _api.get('/attendance/status');
    return asMap(res.data);
  }

  Future<List<Json>> fetchMyAttendanceHistory({int limit = 30}) async {
    final res = await _api.get('/attendance/me', queryParameters: {'limit': limit});
    return asMapList(res.data, ['history']);
  }

  Future<void> checkIn({String workMode = 'office'}) =>
      _api.post('/attendance/check-in', data: {'workMode': workMode});

  Future<void> checkOut() => _api.post('/attendance/check-out');

  // ── Escalations (team leader) ────────────────────────────────────────────
  /// GET /team-leader/escalations -> { stuck, highValue, complaints }
  Future<Json> fetchEscalations() async {
    final res = await _api.get('/team-leader/escalations');
    return asMap(res.data);
  }

  Future<void> escalate(Json lead) =>
      _api.post('/team-leader/escalations', data: {
        '_id': lead['_id'] ?? lead['id'],
        'leadName': lead['name'],
      });
}
