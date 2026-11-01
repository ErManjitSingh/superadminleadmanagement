import '../core/api_client.dart';
import 'service_utils.dart';

/// GET/POST /packages
class PackagesService {
  PackagesService(this._api);
  final ApiClient _api;

  Future<List<Json>> fetchPackages({String? search, String? status, String? packageType}) async {
    final res = await _api.get('/packages', queryParameters: {
      if (search != null && search.isNotEmpty) 'search': search,
      if (status != null && status.isNotEmpty) 'status': status,
      if (packageType != null && packageType.isNotEmpty) 'packageType': packageType,
    });
    return asMapList(res.data, ['packages']);
  }

  Future<Json> fetchPackage(String id) async {
    final res = await _api.get('/packages/$id');
    return asMap(res.data);
  }

  Future<Json> createPackage(Json payload) async {
    final res = await _api.post('/packages', data: payload);
    return asMap(res.data);
  }

  Future<void> publish(String id) => _api.post('/packages/$id/publish');
  Future<void> archive(String id) => _api.post('/packages/$id/archive');
  Future<void> duplicate(String id) => _api.post('/packages/duplicate/$id');
}
