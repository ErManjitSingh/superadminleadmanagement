import '../core/api_client.dart';
import 'service_utils.dart';

/// GET /reminders?tab=today|upcoming|overdue…, /reminders/counts
class RemindersService {
  RemindersService(this._api);
  final ApiClient _api;

  Future<List<Json>> fetchReminders({String tab = 'today', int page = 1}) async {
    final res = await _api.get('/reminders', queryParameters: {
      'tab': tab,
      'page': page,
      'limit': 50,
    });
    return asMapList(res.data, ['reminders', 'followUps']);
  }

  Future<Json> fetchCounts() async {
    final res = await _api.get('/reminders/counts');
    return asMap(res.data);
  }
}
