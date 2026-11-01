import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import 'storage.dart';

class ApiClient {
  ApiClient(this._storage) {
    _dio = Dio(
      BaseOptions(
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        headers: {'Content-Type': 'application/json'},
      ),
    );
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          options.baseUrl = apiBaseUrl;
          final token = await _storage.getToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          final tenant = await _storage.getTenant();
          if (tenant != null && tenant.isNotEmpty) {
            options.headers['x-tenant-subdomain'] = tenant;
          }
          handler.next(options);
        },
        onError: (error, handler) {
          final path = error.requestOptions.path;
          final isLogin = path.contains('/auth/login');
          // Failed login is 401 — do not wipe session / treat as logout.
          if (error.response?.statusCode == 401 && !isLogin) {
            onUnauthorized?.call();
          }
          handler.next(error);
        },
      ),
    );
  }

  /// Browser can call live CRM API directly (localhost origins allowed on VPS CORS).
  static const defaultApiUrl = 'https://crm.exploremybharat.info/api';
  static const defaultCrmWebUrl = 'https://crm.exploremybharat.info/app';
  static const liveApiUrl = 'https://crm.exploremybharat.info/api';
  /// Optional local proxy fallback (only if CORS blocks again).
  static const webProxyApiUrl = 'http://127.0.0.1:8091/api';

  final AuthStorage _storage;
  late final Dio _dio;
  String apiBaseUrl = defaultApiUrl;
  void Function()? onUnauthorized;

  Dio get dio => _dio;

  Future<void> init() async {
    if (kIsWeb) {
      // Prefer live API — VPS CORS now allows http://127.0.0.1:8090
      apiBaseUrl = liveApiUrl;
      await _storage.setApiUrl(liveApiUrl);
      return;
    }
    final stored = await _storage.getApiUrl();
    if (stored != null && stored.isNotEmpty) {
      apiBaseUrl = stored.replaceAll(RegExp(r'/$'), '');
    }
  }

  void setApiBaseUrl(String url) {
    apiBaseUrl = url.replaceAll(RegExp(r'/$'), '');
  }

  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) =>
      _dio.get<T>(path, queryParameters: queryParameters, options: options);

  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Options? options,
  }) =>
      _dio.post<T>(path, data: data, options: options);

  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Options? options,
  }) =>
      _dio.put<T>(path, data: data, options: options);

  Future<Response<T>> delete<T>(String path) => _dio.delete<T>(path);
}

String apiErrorMessage(Object error) {
  if (error is DioException) {
    final data = error.response?.data;
    if (data is Map) {
      final msg = data['message'] ?? data['error'] ?? data['msg'];
      if (msg != null && msg.toString().trim().isNotEmpty) {
        final s = msg.toString();
        final lower = s.toLowerCase();
        if (lower.contains('jwt') ||
            (lower.contains('token') &&
                (lower.contains('expired') || lower.contains('invalid'))) ||
            lower.contains('not authorized')) {
          return 'Session expired — please log in again';
        }
        return s;
      }
    }
    if (data is String && data.trim().isNotEmpty && data.length < 200) {
      final lower = data.toLowerCase();
      if (lower.contains('jwt') || lower.contains('token expired') || lower.contains('invalid token')) {
        return 'Session expired — please log in again';
      }
      return data;
    }
    switch (error.response?.statusCode) {
      case 400:
        return 'Invalid request — please check the form and try again';
      case 401:
        return 'Session expired — please log in again';
      case 403:
        return 'You do not have permission for this action';
      case 404:
        return 'Not found — this record or API route is unavailable';
      case 409:
        return 'Conflict — please refresh and try again';
      case 422:
        return 'Validation failed — please check your input';
      case 500:
      case 502:
      case 503:
        return 'Server error — please try again in a moment';
    }
    if (error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout ||
        error.type == DioExceptionType.sendTimeout) {
      return 'Network timeout — check your connection';
    }
    if (error.type == DioExceptionType.connectionError) {
      return 'No internet connection';
    }
    return 'Something went wrong';
  }
  final s = error.toString();
  if (s.length > 160) return 'Something went wrong';
  return s;
}

PaginatedItems unwrapPagination(dynamic data) {
  if (data is List) {
    return PaginatedItems(items: data, total: data.length, page: 1, limit: data.length);
  }
  if (data is Map) {
    final pagination = data['pagination'] is Map ? data['pagination'] as Map : const {};
    final items = data['items'] ??
        data['leads'] ??
        data['followups'] ??
        data['followUps'] ??
        data['quotations'] ??
        data['data'] ??
        [];
    final list = items is List ? items : <dynamic>[];
    return PaginatedItems(
      items: list,
      total: (data['total'] as num?)?.toInt() ??
          (data['quotationTotal'] as num?)?.toInt() ??
          (pagination['total'] as num?)?.toInt() ??
          list.length,
      page: (data['page'] as num?)?.toInt() ?? (pagination['page'] as num?)?.toInt() ?? 1,
      limit: (data['limit'] as num?)?.toInt() ??
          (pagination['limit'] as num?)?.toInt() ??
          (list.isEmpty ? 20 : list.length),
    );
  }
  return PaginatedItems(items: const [], total: 0, page: 1, limit: 20);
}

class PaginatedItems {
  final List<dynamic> items;
  final int total;
  final int page;
  final int limit;

  PaginatedItems({
    required this.items,
    required this.total,
    required this.page,
    required this.limit,
  });
}
