import '../core/api_client.dart';
import '../models/models.dart';

class NotificationsApi {
  NotificationsApi(this._api);
  final ApiClient _api;

  Future<PaginatedResult<AppNotification>> fetchList({int page = 1, int limit = 50}) async {
    final res = await _api.get('/notifications', queryParameters: {'page': page, 'limit': limit});
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

  Future<int> fetchUnreadCount() async {
    final res = await _api.get('/notifications/unread-count');
    final data = res.data;
    if (data is Map) {
      return (data['count'] as num?)?.toInt() ?? (data['unread'] as num?)?.toInt() ?? 0;
    }
    if (data is num) return data.toInt();
    return 0;
  }

  Future<void> markRead(String id) async {
    await _api.put('/notifications/$id/read');
  }

  Future<void> markAllRead() async {
    await _api.put('/notifications/read-all');
  }
}
