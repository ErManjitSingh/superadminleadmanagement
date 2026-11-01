import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../core/api_client.dart';
import '../core/roles.dart';
import '../core/storage.dart';
import '../models/models.dart';
import '../services/auth_service.dart';

class AuthProvider extends ChangeNotifier {
  AuthProvider({
    required AuthStorage storage,
    required ApiClient api,
    required AuthService authService,
  })  : _storage = storage,
        _api = api,
        _auth = authService;

  final AuthStorage _storage;
  final ApiClient _api;
  final AuthService _auth;

  User? user;
  String? token;
  bool isLoading = true;
  String apiUrl = ApiClient.defaultApiUrl;
  String crmWebUrl = ApiClient.defaultCrmWebUrl;
  String tenantSubdomain = '';

  bool get isAuthenticated => user != null && token != null;

  Future<void> bootstrap() async {
    isLoading = true;
    notifyListeners();
    try {
      await _api.init();
      final storedUrl = await _storage.getApiUrl();
      final storedWeb = await _storage.getCrmWebUrl();
      final storedTenant = await _storage.getTenant();
      final storedToken = await _storage.getToken();
      final storedUser = await _storage.getUser();

      if (kIsWeb) {
        // Prefer live API (CORS allows localhost). Keep proxy only if user set it.
        apiUrl = ApiClient.liveApiUrl;
        _api.setApiBaseUrl(ApiClient.liveApiUrl);
      } else if (storedUrl != null && storedUrl.isNotEmpty) {
        apiUrl = storedUrl;
        _api.setApiBaseUrl(storedUrl);
      } else {
        apiUrl = ApiClient.defaultApiUrl;
      }
      if (storedWeb != null && storedWeb.isNotEmpty) crmWebUrl = storedWeb;
      if (storedTenant != null) tenantSubdomain = storedTenant;

      if (storedToken != null && storedUser != null) {
        token = storedToken;
        user = storedUser.copyWith(token: storedToken);
        try {
          final me = await _auth.me();
          // Prefer freshly re-issued token from /auth/me (sliding session)
          final nextToken = (me.token != null && me.token!.isNotEmpty) ? me.token! : storedToken;
          token = nextToken;
          user = me.copyWith(token: nextToken);
          await _storage.saveSession(user!, tenantSubdomain: tenantSubdomain);
        } catch (e) {
          // Keep local session on network blips — only wipe on real auth failure
          final status = e is DioException ? e.response?.statusCode : null;
          final msg = e.toString().toLowerCase();
          final isAuthFail = status == 401
              || msg.contains('unauthorized')
              || msg.contains('jwt')
              || msg.contains('token expired')
              || msg.contains('invalid token')
              || msg.contains('not authorized');
          if (isAuthFail) {
            await clearSession();
          }
          // else: stay logged in with stored token/user
        }
      }
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> login(String email, String password, {String? tenant}) async {
    final session = await _auth.login(email, password, tenant: tenant ?? tenantSubdomain);
    if (!isMobileRoleSupported(session.role)) {
      throw Exception('This role is not supported on mobile yet.');
    }
    await _storage.saveSession(session, tenantSubdomain: tenant ?? tenantSubdomain);
    token = session.token;
    user = session;
    notifyListeners();
  }

  Future<void> logout() async {
    await _auth.logout();
    await clearSession();
  }

  Future<void> clearSession() async {
    await _storage.clearSession();
    user = null;
    token = null;
    notifyListeners();
  }

  Future<void> setApiUrl(String url) async {
    final trimmed = url.trim();
    await _storage.setApiUrl(trimmed);
    _api.setApiBaseUrl(trimmed);
    apiUrl = trimmed;
    // derive web url if possible
    if (trimmed.endsWith('/api')) {
      final web = '${trimmed.substring(0, trimmed.length - 4)}/app';
      crmWebUrl = web;
      await _storage.setCrmWebUrl(web);
    }
    notifyListeners();
  }

  Future<void> setTenant(String subdomain) async {
    tenantSubdomain = subdomain.trim().toLowerCase();
    if (user != null) {
      await _storage.saveSession(user!.copyWith(token: token), tenantSubdomain: tenantSubdomain);
    } else {
      await _storage.saveSession(
        User(id: '', name: '', email: '', role: 'sales_executive', token: ''),
        tenantSubdomain: tenantSubdomain,
      );
      await _storage.clearSession();
    }
    notifyListeners();
  }

  Future<void> setCrmWebUrl(String url) async {
    crmWebUrl = url.trim().replaceAll(RegExp(r'/$'), '');
    await _storage.setCrmWebUrl(crmWebUrl);
    notifyListeners();
  }
}
