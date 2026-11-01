import 'package:dio/dio.dart';

import '../core/api_client.dart';
import '../models/models.dart';

class AuthService {
  AuthService(this._api);
  final ApiClient _api;

  Future<User> login(String email, String password, {String? tenant}) async {
    final headers = <String, dynamic>{};
    if (tenant != null && tenant.trim().isNotEmpty) {
      headers['x-tenant-subdomain'] = tenant.trim().toLowerCase();
    }
    final res = await _api.post(
      '/auth/login',
      data: {'email': email, 'password': password},
      options: Options(headers: headers),
    );
    final data = Map<String, dynamic>.from(res.data as Map);
    if (data['token'] == null) throw Exception('Invalid response from server');
    return User.fromJson(data);
  }

  Future<User> me() async {
    final res = await _api.get('/auth/me');
    final data = Map<String, dynamic>.from(res.data as Map);
    // /auth/me may return a refreshed JWT — keep it on the user model
    return User.fromJson(data);
  }

  Future<void> logout() async {
    try {
      await _api.post('/auth/logout');
    } catch (_) {}
  }
}
