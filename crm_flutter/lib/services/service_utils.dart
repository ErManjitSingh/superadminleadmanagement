// Small helpers for tolerant JSON parsing of CRM API responses
// (some endpoints return a bare list, others `{ data | items | ... }`).

typedef Json = Map<String, dynamic>;

Json asMap(dynamic data) =>
    data is Map ? Json.from(data) : <String, dynamic>{};

List<Json> asMapList(dynamic data, [List<String> keys = const []]) {
  dynamic raw = data;
  if (data is Map) {
    raw = null;
    for (final k in [...keys, 'data', 'items', 'results']) {
      if (data[k] is List) {
        raw = data[k];
        break;
      }
    }
  }
  if (raw is! List) return [];
  return raw.whereType<Map>().map((e) => Json.from(e)).toList();
}

/// First non-empty string among [keys] (supports populated refs with `name`).
String? pickStr(Map<dynamic, dynamic>? m, List<String> keys) {
  if (m == null) return null;
  for (final k in keys) {
    final v = m[k];
    if (v == null) continue;
    if (v is Map) {
      final n = v['name'] ?? v['title'] ?? v['email'];
      if (n != null && n.toString().isNotEmpty) return n.toString();
      continue;
    }
    final s = v.toString();
    if (s.isNotEmpty && s != 'null') return s;
  }
  return null;
}

num pickNum(Map<dynamic, dynamic>? m, List<String> keys) {
  if (m == null) return 0;
  for (final k in keys) {
    final v = m[k];
    if (v is num) return v;
    if (v is String) {
      final n = num.tryParse(v);
      if (n != null) return n;
    }
  }
  return 0;
}

String idOf(Map<dynamic, dynamic> m) => (m['_id'] ?? m['id'] ?? '').toString();
