import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

/// Local in-progress quotation builder draft — survives app kill/reopen.
class QuoteDraftStore {
  static const _prefix = 'crm_quote_builder_draft_v1_';

  static String _key({String? quoteId, String? leadId}) {
    if (quoteId != null && quoteId.trim().isNotEmpty) return '$_prefix${quoteId.trim()}';
    if (leadId != null && leadId.trim().isNotEmpty) return '${_prefix}lead_${leadId.trim()}';
    return '${_prefix}anon';
  }

  static Future<void> save(Map<String, dynamic> draft, {String? quoteId, String? leadId}) async {
    final prefs = await SharedPreferences.getInstance();
    final payload = {
      ...draft,
      'savedAt': DateTime.now().toIso8601String(),
      'quoteId': quoteId,
      'leadId': leadId,
    };
    await prefs.setString(_key(quoteId: quoteId, leadId: leadId), jsonEncode(payload));
    // Keep lead-keyed copy so "New quotation" for same lead can restore.
    if (leadId != null && leadId.trim().isNotEmpty) {
      await prefs.setString(_key(leadId: leadId), jsonEncode(payload));
    }
  }

  static Future<Map<String, dynamic>?> load({String? quoteId, String? leadId}) async {
    final prefs = await SharedPreferences.getInstance();
    String? raw;
    if (quoteId != null && quoteId.trim().isNotEmpty) {
      raw = prefs.getString(_key(quoteId: quoteId));
    }
    raw ??= (leadId != null && leadId.trim().isNotEmpty) ? prefs.getString(_key(leadId: leadId)) : null;
    if (raw == null || raw.isEmpty) return null;
    try {
      final map = jsonDecode(raw);
      if (map is Map) return Map<String, dynamic>.from(map);
    } catch (_) {}
    return null;
  }

  static Future<void> clear({String? quoteId, String? leadId}) async {
    final prefs = await SharedPreferences.getInstance();
    if (quoteId != null && quoteId.trim().isNotEmpty) {
      await prefs.remove(_key(quoteId: quoteId));
    }
    if (leadId != null && leadId.trim().isNotEmpty) {
      await prefs.remove(_key(leadId: leadId));
    }
  }
}
