import '../core/api_client.dart';
import 'service_utils.dart';

/// GET /payments, /booking-payments/dashboard, /booking-payments/customer-payments
class PaymentsService {
  PaymentsService(this._api);
  final ApiClient _api;

  Future<List<Json>> fetchPayments({String? status, String? search}) async {
    final res = await _api.get('/payments', queryParameters: {
      if (status != null && status.isNotEmpty) 'status': status,
      if (search != null && search.isNotEmpty) 'search': search,
    });
    return asMapList(res.data, ['payments']);
  }

  Future<Json> fetchPayment(String id) async {
    final res = await _api.get('/payments/$id');
    return asMap(res.data);
  }

  Future<Json> createPayment(Json payload) async {
    final res = await _api.post('/payments', data: payload);
    return asMap(res.data);
  }

  /// Booking-payments dashboard stats (collections, pending, trends…).
  Future<Json> fetchDashboard() async {
    final res = await _api.get('/booking-payments/dashboard');
    return asMap(res.data);
  }

  Future<List<Json>> fetchCustomerPayments({String? search, String? status}) async {
    final res = await _api.get('/booking-payments/customer-payments', queryParameters: {
      if (search != null && search.isNotEmpty) 'search': search,
      if (status != null && status.isNotEmpty) 'status': status,
    });
    return asMapList(res.data, ['payments', 'customers', 'rows']);
  }
}
