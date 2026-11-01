import '../core/api_client.dart';
import 'service_utils.dart';

/// GET /emails/stats, /emails/mailbox
class EmailService {
  EmailService(this._api);
  final ApiClient _api;

  Future<Json> fetchStats() async {
    final res = await _api.get('/emails/stats');
    return asMap(res.data);
  }

  /// [folder]: inbox | sent | failed
  Future<List<Json>> fetchMailbox({String folder = 'inbox', String? search, int page = 1}) async {
    final res = await _api.get('/emails/mailbox', queryParameters: {
      'folder': folder,
      'page': page,
      'limit': 50,
      if (search != null && search.isNotEmpty) 'search': search,
    });
    return asMapList(res.data, ['messages', 'emails']);
  }

  Future<Json> fetchMessage(String type, String id) async {
    final res = await _api.get('/emails/messages/$type/$id');
    return asMap(res.data);
  }

  Future<void> syncReplies() => _api.post('/emails/sync-replies');
}
