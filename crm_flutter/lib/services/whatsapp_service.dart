import '../core/api_client.dart';
import 'service_utils.dart';

/// GET /whatsapp/conversations, /whatsapp/messages/:leadId
class WhatsappService {
  WhatsappService(this._api);
  final ApiClient _api;

  Future<List<Json>> fetchConversations({String? search, String? status}) async {
    final res = await _api.get('/whatsapp/conversations', queryParameters: {
      'page': 1,
      'limit': 50,
      if (search != null && search.isNotEmpty) 'search': search,
      if (status != null && status.isNotEmpty) 'status': status,
    });
    return asMapList(res.data, ['conversations']);
  }

  Future<List<Json>> fetchMessages(String leadId) async {
    final res = await _api.get('/whatsapp/messages/$leadId');
    return asMapList(res.data, ['messages']);
  }

  Future<void> sendMessage({required String leadId, required String text}) =>
      _api.post('/whatsapp/messages', data: {'leadId': leadId, 'text': text});

  Future<void> markRead(String leadId) => _api.put('/whatsapp/read/$leadId');
}
