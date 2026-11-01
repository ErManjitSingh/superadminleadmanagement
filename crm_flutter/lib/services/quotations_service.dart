import 'dart:convert';
import 'dart:typed_data';

import '../core/api_client.dart';
import '../core/roles.dart';
import '../models/models.dart';

class QuotationsService {
  QuotationsService(this._api);
  final ApiClient _api;

  String _base(String role) {
    final prefix = getRoleApiPrefix(role);
    return prefix.isEmpty ? '/quotations' : '$prefix/quotations';
  }

  /// Upload generated PDF (same as website POST …/quotations/:id/pdf).
  Future<Map<String, dynamic>> uploadQuotationPdf(
    String role,
    String quoteId,
    Uint8List pdfBytes,
  ) async {
    final body = {'pdfBase64': base64Encode(pdfBytes)};
    try {
      final res = await _api.post('${_base(role)}/$quoteId/pdf', data: body);
      return Map<String, dynamic>.from(res.data as Map? ?? {});
    } catch (_) {
      if (role != 'admin') {
        final res = await _api.post('/quotations/$quoteId/pdf', data: body);
        return Map<String, dynamic>.from(res.data as Map? ?? {});
      }
      rethrow;
    }
  }

  /// Executive send/submit actions: PUT { action: 'send' | 'submit' }.
  Future<QuotationDetail> quotationAction(
    String role,
    String quoteId, {
    required String action,
    String? remarks,
  }) async {
    final res = await _api.put(
      '${_base(role)}/$quoteId',
      data: {
        'action': action,
        if (remarks != null && remarks.isNotEmpty) 'remarks': remarks,
      },
    );
    return QuotationDetail(_unwrapQuotation(res.data));
  }

  /// Sales manager / team leader expose filtered lists as `/quotations/:segment`.
  Set<String> _segmentStatusesFor(String role) {
    if (role == 'sales_manager') {
      // pending bucket = sent + negotiation + pending_approval
      return const {'pending', 'approved', 'rejected'};
    }
    if (role == 'team_leader') {
      return const {'pending', 'approved', 'rejected', 'negotiation'};
    }
    return const {};
  }

  String _listPath(String role, String? status) {
    final base = _base(role);
    final s = (status ?? '').trim().toLowerCase();
    if (s.isNotEmpty && _segmentStatusesFor(role).contains(s)) {
      return '$base/$s';
    }
    return base;
  }

  String? _statusQuery(String role, String? status) {
    final s = (status ?? '').trim().toLowerCase();
    if (s.isEmpty) return null;
    // Segment routes already encode the filter — don't also send ?status=.
    if (_segmentStatusesFor(role).contains(s)) return null;
    if (s == 'pending') return 'pending_approval';
    return s;
  }

  Future<PaginatedResult<Quotation>> fetchQuotations(
    String role, {
    int page = 1,
    int limit = 50,
    String? status,
    String? search,
  }) async {
    final path = _listPath(role, status);
    final statusParam = _statusQuery(role, status);
    final searchTrim = search?.trim();
    final query = <String, dynamic>{
      'page': page,
      'limit': limit,
      if (statusParam != null) 'status': statusParam,
      if (searchTrim != null && searchTrim.isNotEmpty) 'search': searchTrim,
    };

    try {
      final res = await _api.get(path, queryParameters: query);
      return _pageFromResponse(res.data);
    } catch (_) {
      // Fallback: shared /quotations if role path fails.
      if (role == 'admin') rethrow;
      final s = (status ?? '').trim().toLowerCase();
      final fallbackStatus = s.isEmpty || s == 'pending'
          ? null
          : (s == 'pending' ? 'pending_approval' : s);
      final res = await _api.get(
        '/quotations',
        queryParameters: {
          'page': page,
          'limit': limit,
          if (fallbackStatus != null) 'status': fallbackStatus,
          if (searchTrim != null && searchTrim.isNotEmpty) 'search': searchTrim,
        },
      );
      return _pageFromResponse(res.data);
    }
  }

  PaginatedResult<Quotation> _pageFromResponse(dynamic data) {
    final pageData = unwrapPagination(data);
    final items = <Quotation>[];
    for (final e in pageData.items) {
      if (e is! Map) continue;
      try {
        final q = Quotation.fromJson(Map<String, dynamic>.from(e));
        if (q.id.isNotEmpty) items.add(q);
      } catch (_) {
        // Skip malformed rows so one bad quote never blanks the whole list.
      }
    }
    return PaginatedResult(
      items: items,
      total: pageData.total,
      page: pageData.page,
      limit: pageData.limit,
    );
  }

  Future<QuotationDetail> fetchQuotation(String role, String quoteId) async {
    try {
      final res = await _api.get('${_base(role)}/$quoteId');
      return QuotationDetail(_unwrapQuotation(res.data));
    } catch (e) {
      // Fallback to shared quotations route (admin / cross-role)
      if (role != 'admin') {
        final res = await _api.get('/quotations/$quoteId');
        return QuotationDetail(_unwrapQuotation(res.data));
      }
      rethrow;
    }
  }

  Map<String, dynamic> _unwrapQuotation(dynamic data) {
    if (data is Map) {
      final inner = data['quotation'] is Map ? data['quotation'] as Map : data;
      return Map<String, dynamic>.from(inner);
    }
    throw Exception('Invalid quotation response');
  }

  Future<List<Quotation>> fetchLeadQuotations(String role, String leadId) async {
    final prefix = getRoleApiPrefix(role);
    final path = prefix.isEmpty ? '/leads/$leadId/quotations' : '$prefix/leads/$leadId/quotations';
    try {
      final res = await _api.get(path, queryParameters: {'page': 1, 'limit': 50});
      return _pageFromResponse(res.data).items;
    } catch (_) {
      final res = await _api.get('/leads/$leadId/quotations', queryParameters: {'page': 1, 'limit': 50});
      return _pageFromResponse(res.data).items;
    }
  }

  String _statusFor(String role, bool asDraft) {
    if (asDraft) return 'draft';
    switch (role) {
      case 'sales_executive':
        return 'pending_approval';
      case 'admin':
        return 'sent';
      default:
        return 'approved';
    }
  }

  /// Quick create (package name + amount) — port of createLeadQuotation.
  Future<QuotationDetail> createLeadQuotation(
    String role, {
    required String leadId,
    required String packageName,
    required num amount,
    String? notes,
    bool asDraft = false,
    int adults = 2,
    int duration = 0,
    String? destination,
  }) async {
    final pkg = packageName.trim().isEmpty ? 'Custom Package' : packageName.trim();
    final dest = (destination ?? pkg).trim();
    final snapshot = {'name': pkg, 'destination': dest, 'duration': duration};
    final n = notes?.trim() ?? '';
    final body = <String, dynamic>{
      'leadId': leadId,
      'status': _statusFor(role, asDraft),
      'packageSnapshot': snapshot,
      'packageInfo': {
        'packageName': pkg,
        'destination': dest,
        'duration': duration,
        'adults': adults,
        'children': 0,
        'infants': 0,
        'mealPlan': '',
        'hotelCategory': '',
      },
      'pricing': {
        'baseCost': amount,
        'hotelCost': 0,
        'cabCost': 0,
        'flightCost': 0,
        'activityCost': 0,
        'taxes': 0,
        'markup': 0,
        'discount': 0,
        'gst': 0,
        'total': amount,
      },
      'costing': {
        'lineItems': [],
        'subtotal': amount,
        'taxes': 0,
        'markup': 0,
        'discount': 0,
        'grandTotal': amount,
      },
      'paymentPlan': [
        {'label': 'Advance', 'percent': 30, 'amount': (amount * 0.3).round()},
        {'label': 'Balance', 'percent': 70, 'amount': (amount * 0.7).round()},
      ],
      'importantNotes': {
        'cancellationPolicy': '',
        'termsAndConditions': '',
        'travelGuidelines': n,
        'weather': '',
        'packingTips': '',
      },
      'customizations': n,
      'selectedHotels': [],
      'selectedCabs': [],
      'selectedFlights': [],
      'selectedActivities': [],
    };
    // Sales executive API maps body.package -> packageSnapshot (not ObjectId).
    if (role == 'sales_executive') body['package'] = snapshot;
    final res = await _api.post(_base(role), data: body);
    return QuotationDetail(_unwrapQuotation(res.data));
  }

  /// Full builder save — port of saveQuotationBuilder (autosave endpoints).
  Future<QuotationDetail> saveQuotationBuilder(
    String role,
    QuotationSavePayload payload,
  ) async {
    final amount = payload.amount;
    final packageName =
        payload.packageName.trim().isEmpty ? 'Custom Package' : payload.packageName.trim();
    final destination = (payload.destination.isEmpty ? packageName : payload.destination).trim();
    final duration = payload.duration > 0
        ? payload.duration
        : (payload.itinerary.isEmpty ? 1 : payload.itinerary.length);

    final status = payload.status ?? _statusFor(role, payload.asDraft);

    final itinerary = <Map<String, dynamic>>[];
    for (var i = 0; i < payload.itinerary.length; i++) {
      final d = payload.itinerary[i];
      final day = d.day > 0 ? d.day : i + 1;
      itinerary.add({
        'day': day,
        'title': d.title.isEmpty ? 'Day ${i + 1}' : d.title,
        'description': d.description,
        'activities': d.description,
      });
    }

    final snapshot = {
      'name': packageName,
      'destination': destination,
      'duration': duration,
      'itinerary': itinerary,
      'inclusions': payload.inclusions,
      'exclusions': payload.exclusions,
    };

    final selectedHotels = <Map<String, dynamic>>[];
    var hotelIdx = 0;
    for (final h in payload.hotels) {
      if (h.name.trim().isEmpty) continue;
      hotelIdx++;
      selectedHotels.add({
        'day': hotelIdx,
        'name': h.name.trim(),
        'nights': h.nights > 0 ? h.nights : 1,
        'roomType': h.roomType,
        'mealPlan': h.mealPlan.isNotEmpty ? h.mealPlan : payload.mealPlan,
      });
    }

    final selectedCabs = <Map<String, dynamic>>[];
    for (final c in payload.cabs) {
      if (c.vehicleName.trim().isEmpty) continue;
      selectedCabs.add({
        'vehicleName': c.vehicleName.trim(),
        'vehicleType': c.vehicleType.isNotEmpty ? c.vehicleType : c.vehicleName,
        'cost': c.cost,
        'vehicleCount': c.vehicleCount > 0 ? c.vehicleCount : 1,
      });
    }
    final cabCost = selectedCabs.fold<num>(0, (s, c) => s + (c['cost'] as num));
    final n = payload.notes?.trim() ?? '';

    final body = <String, dynamic>{
      'leadId': payload.leadId,
      'status': status,
      'packageSnapshot': snapshot,
      'packageInfo': {
        'packageName': packageName,
        'destination': destination,
        'duration': duration,
        'adults': payload.adults > 0 ? payload.adults : 2,
        'children': payload.children,
        'infants': 0,
        'mealPlan': payload.mealPlan,
        'hotelCategory': payload.hotelCategory,
        if (payload.travelDate != null && payload.travelDate!.isNotEmpty)
          'travelDate': payload.travelDate,
        'totalCost': amount,
      },
      'pricing': {
        'baseCost': amount,
        'hotelCost': 0,
        'cabCost': cabCost,
        'flightCost': 0,
        'activityCost': 0,
        'taxes': 0,
        'markup': 0,
        'discount': 0,
        'gst': 0,
        'total': amount,
        'grandTotal': amount,
      },
      'costing': {
        'lineItems': [],
        'subtotal': amount,
        'taxes': 0,
        'markup': 0,
        'discount': 0,
        'grandTotal': amount,
      },
      'paymentPlan': [
        {'label': 'Booking Confirmation (Advance)', 'percent': 30, 'amount': (amount * 0.3).round()},
        {'label': 'Before Tour Begins', 'percent': 50, 'amount': (amount * 0.5).round()},
        {'label': 'On Arrival (Balance)', 'percent': 20, 'amount': (amount * 0.2).round()},
      ],
      'importantNotes': {
        'cancellationPolicy': '',
        'termsAndConditions': '',
        'travelGuidelines': n,
        'weather': '',
        'packingTips': '',
      },
      'customizations': n,
      'selectedHotels': selectedHotels,
      'selectedCabs': selectedCabs,
      'selectedFlights': [],
      'selectedActivities': [],
    };

    if (role == 'sales_executive') body['package'] = snapshot;

    final base = _base(role);
    if (payload.quoteId != null && payload.quoteId!.isNotEmpty) {
      final res = await _api.post('$base/${payload.quoteId}/autosave', data: body);
      return QuotationDetail(_unwrapQuotation(res.data));
    }
    try {
      final res = await _api.post('$base/autosave', data: body);
      return QuotationDetail(_unwrapQuotation(res.data));
    } catch (_) {
      final res = await _api.post(base, data: body);
      return QuotationDetail(_unwrapQuotation(res.data));
    }
  }
}

class QuoteDay {
  QuoteDay({this.day = 0, this.title = '', this.description = ''});
  int day;
  String title;
  String description;
}

class QuoteHotel {
  QuoteHotel({this.name = '', this.nights = 1, this.roomType = '', this.mealPlan = ''});
  String name;
  int nights;
  String roomType;
  String mealPlan;
}

class QuoteCab {
  QuoteCab({this.vehicleName = '', this.vehicleType = '', this.cost = 0, this.vehicleCount = 1});
  String vehicleName;
  String vehicleType;
  num cost;
  int vehicleCount;
}

class QuotationSavePayload {
  QuotationSavePayload({
    required this.leadId,
    this.quoteId,
    this.status,
    this.asDraft = false,
    required this.packageName,
    this.destination = '',
    this.duration = 0,
    this.adults = 2,
    this.children = 0,
    this.mealPlan = '',
    this.hotelCategory = '',
    this.travelDate,
    this.amount = 0,
    this.notes,
    this.inclusions = const [],
    this.exclusions = const [],
    this.itinerary = const [],
    this.hotels = const [],
    this.cabs = const [],
  });

  final String leadId;
  final String? quoteId;
  final String? status;
  final bool asDraft;
  final String packageName;
  final String destination;
  final int duration;
  final int adults;
  final int children;
  final String mealPlan;
  final String hotelCategory;
  final String? travelDate;
  final num amount;
  final String? notes;
  final List<String> inclusions;
  final List<String> exclusions;
  final List<QuoteDay> itinerary;
  final List<QuoteHotel> hotels;
  final List<QuoteCab> cabs;
}
