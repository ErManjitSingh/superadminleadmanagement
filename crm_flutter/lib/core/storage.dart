import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/models.dart';

class AuthStorage {
  static const _token = 'crm_token';
  static const _user = 'crm_user';
  static const _tenant = 'crm_tenant_subdomain';
  static const _apiUrl = 'crm_api_url';
  static const _crmWebUrl = 'crm_web_url';

  Future<void> saveSession(User user, {String? tenantSubdomain}) async {
    final prefs = await SharedPreferences.getInstance();
    if (user.token != null) await prefs.setString(_token, user.token!);
    await prefs.setString(_user, jsonEncode(user.toJson()));
    if (tenantSubdomain != null) {
      if (tenantSubdomain.trim().isEmpty) {
        await prefs.remove(_tenant);
      } else {
        await prefs.setString(_tenant, tenantSubdomain.trim().toLowerCase());
      }
    }
  }

  Future<void> clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_token);
    await prefs.remove(_user);
  }

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_token);
  }

  Future<User?> getUser() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_user);
    if (raw == null) return null;
    try {
      return User.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  Future<String?> getTenant() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tenant);
  }

  Future<void> setApiUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_apiUrl, url.trim());
  }

  Future<String?> getApiUrl() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_apiUrl);
  }

  Future<void> setCrmWebUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_crmWebUrl, url.trim());
  }

  Future<String?> getCrmWebUrl() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_crmWebUrl);
  }
}
