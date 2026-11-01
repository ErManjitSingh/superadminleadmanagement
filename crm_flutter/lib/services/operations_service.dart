import 'package:dio/dio.dart';

import '../core/api_client.dart';
import '../models/models.dart';

/// Operations manager API (ported from crm-mobile/src/services/operations.ts).
class OperationsService {
  OperationsService(this._api);
  final ApiClient _api;

  static const _base = '/operations-manager';

  Future<OpsDashboard> fetchOpsDashboard() async {
    final res = await _api.get('$_base/dashboard');
    final data = res.data;
    if (data is Map) return OpsDashboard.fromJson(Map<String, dynamic>.from(data));
    return OpsDashboard.empty();
  }

  Future<PaginatedResult<OpsBooking>> fetchOpsBookings({
    int page = 1,
    int limit = 20,
    String? status,
    String? search,
  }) async {
    final res = await _api.get(
      '$_base/bookings',
      queryParameters: {
        'page': page,
        'limit': limit,
        if (status != null && status.isNotEmpty) 'status': status,
        if (search != null && search.isNotEmpty) 'search': search,
      },
    );
    final data = res.data;
    final pageData = unwrapPagination(data);
    var total = pageData.total;
    var pg = pageData.page;
    var lim = pageData.limit;
    if (data is Map && data['pagination'] is Map) {
      final p = data['pagination'] as Map;
      total = (p['total'] as num?)?.toInt() ?? pageData.items.length;
      pg = (p['page'] as num?)?.toInt() ?? 1;
      lim = (p['limit'] as num?)?.toInt() ?? 20;
    }
    return PaginatedResult(
      items: pageData.items
          .whereType<Map>()
          .map((e) => OpsBooking.fromJson(Map<String, dynamic>.from(e)))
          .toList(),
      total: total,
      page: pg,
      limit: lim,
    );
  }

  Future<OpsBooking> fetchOpsBooking(String id) async {
    final res = await _api.get('$_base/bookings/$id');
    final data = res.data;
    if (data is Map) {
      final inner = data['booking'] is Map ? data['booking'] as Map : data;
      return OpsBooking.fromJson(Map<String, dynamic>.from(inner));
    }
    throw Exception('Invalid booking response');
  }

  List<Map<String, dynamic>> _listFrom(dynamic data) {
    dynamic raw = data;
    if (data is Map) raw = data['vouchers'] ?? data['tasks'] ?? data['items'] ?? data['data'] ?? [];
    if (raw is! List) return [];
    return raw.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
  }

  Future<List<OpsVoucher>> fetchOpsVouchers({String? type, String? bookingId}) async {
    final query = <String, dynamic>{
      if (type != null && type.isNotEmpty && type != 'all') 'type': type == 'cab' ? 'transport' : type,
      if (bookingId != null && bookingId.isNotEmpty) 'bookingId': bookingId,
    };
    final res = await _api.get(
      '$_base/vouchers',
      queryParameters: query.isEmpty ? null : query,
    );
    return _listFrom(res.data).map(OpsVoucher.fromJson).toList();
  }

  /// GET /operations-manager/bookings/:id/execution — voucher hub for one booking.
  Future<OpsBookingExecution> fetchBookingExecution(String bookingId) async {
    final res = await _api.get('$_base/bookings/$bookingId/execution');
    final data = res.data;
    if (data is Map) {
      return OpsBookingExecution.fromJson(Map<String, dynamic>.from(data));
    }
    throw Exception('Invalid booking execution response');
  }

  /// POST /operations-manager/bookings/:id/vouchers/generate
  Future<OpsVoucher> generateVoucher(
    String bookingId, {
    required String type,
    int assignmentIndex = 0,
  }) async {
    final normalized = type == 'cab' ? 'transport' : type;
    final res = await _api.post(
      '$_base/bookings/$bookingId/vouchers/generate',
      data: {
        'type': normalized,
        'assignmentIndex': assignmentIndex,
      },
      options: Options(
        receiveTimeout: const Duration(seconds: 120),
        sendTimeout: const Duration(seconds: 30),
      ),
    );
    final data = res.data;
    if (data is Map) {
      final inner = data['voucher'] is Map ? data['voucher'] as Map : data;
      return OpsVoucher.fromJson(Map<String, dynamic>.from(inner));
    }
    throw Exception('Invalid generate voucher response');
  }

  /// POST /operations-manager/bookings/:id/vouchers/generate-all
  Future<List<OpsVoucher>> generateAllVouchers(String bookingId) async {
    final res = await _api.post(
      '$_base/bookings/$bookingId/vouchers/generate-all',
      options: Options(
        receiveTimeout: const Duration(seconds: 180),
        sendTimeout: const Duration(seconds: 30),
      ),
    );
    return _listFrom(res.data).map(OpsVoucher.fromJson).toList();
  }

  /// POST /operations-manager/vouchers/:id/regenerate
  Future<OpsVoucher> regenerateVoucher(String voucherId) async {
    final res = await _api.post(
      '$_base/vouchers/$voucherId/regenerate',
      options: Options(
        receiveTimeout: const Duration(seconds: 120),
        sendTimeout: const Duration(seconds: 30),
      ),
    );
    final data = res.data;
    if (data is Map) {
      final inner = data['voucher'] is Map ? data['voucher'] as Map : data;
      return OpsVoucher.fromJson(Map<String, dynamic>.from(inner));
    }
    throw Exception('Invalid regenerate voucher response');
  }

  /// GET /operations-manager/vouchers/:id/preview-html
  Future<String> fetchVoucherPreviewHtml(String voucherId) async {
    final res = await _api.get(
      '$_base/vouchers/$voucherId/preview-html',
      options: Options(
        responseType: ResponseType.plain,
        receiveTimeout: const Duration(seconds: 90),
      ),
    );
    final data = res.data;
    if (data is String && data.trim().isNotEmpty) return data;
    if (data is Map && data['html'] != null) return data['html'].toString();
    throw Exception('Voucher preview HTML empty');
  }

  /// PUT /operations-manager/vouchers/:id — update payload (CRM Edit Voucher).
  Future<OpsVoucher> updateVoucher(
    String voucherId, {
    required Map<String, dynamic> payload,
  }) async {
    final res = await _api.put(
      '$_base/vouchers/$voucherId',
      data: {'payload': payload},
    );
    final data = res.data;
    if (data is Map) {
      final inner = data['voucher'] is Map ? data['voucher'] as Map : data;
      return OpsVoucher.fromJson(Map<String, dynamic>.from(inner));
    }
    throw Exception('Invalid update voucher response');
  }

  /// Save voucher fields + sync booking money + regenerate PDF (CRM edit flow).
  Future<OpsVoucher> saveVoucherEdits({
    required OpsVoucher voucher,
    required String type,
    required Map<String, String> form,
    OpsBooking? booking,
  }) async {
    num? parseMoney(String? v) {
      if (v == null || v.trim().isEmpty) return null;
      return num.tryParse(v.trim());
    }

    final amountNum = parseMoney(form['amount']);
    final advanceNum = parseMoney(form['advancePaid']);
    final remainingNum = parseMoney(form['remainingBalance']);

    final moneyPayload = <String, dynamic>{
      if (amountNum != null) ...{'amount': amountNum, 'totalAmount': amountNum},
      if (advanceNum != null) 'advancePaid': advanceNum,
      if (remainingNum != null) 'remainingBalance': remainingNum,
    };

    final merged = <String, dynamic>{
      ...voucher.payload,
      ...form,
      ...moneyPayload,
    };
    if (type == 'client') {
      merged.remove('itinerary');
    }

    await updateVoucher(voucher.id, payload: merged);

    final bookingId = booking?.id ?? voucher.bookingId;
    if (bookingId != null && bookingId.isNotEmpty) {
      final idx = voucher.assignmentIndex;
      final moneyPatch = <String, dynamic>{
        if (amountNum != null) 'amount': amountNum,
        if (advanceNum != null) 'advancePaid': advanceNum,
        if (remainingNum != null) 'remainingBalance': remainingNum,
      };
      try {
        if (type == 'hotel' && (booking?.hotels.isNotEmpty ?? false)) {
          final hotels = booking!.hotels.asMap().entries.map((e) {
            final h = Map<String, dynamic>.from(e.value);
            if (e.key == idx) {
              h.addAll(moneyPatch);
              if ((form['hotelName'] ?? '').trim().isNotEmpty) {
                h['hotelName'] = form['hotelName']!.trim();
                h['name'] = form['hotelName']!.trim();
              }
              if ((form['roomType'] ?? '').trim().isNotEmpty) h['roomType'] = form['roomType']!.trim();
              if ((form['mealPlan'] ?? '').trim().isNotEmpty) h['mealPlan'] = form['mealPlan']!.trim();
            }
            return h;
          }).toList();
          await updateBooking(bookingId, {'hotels': hotels});
        } else if (type == 'transport' && moneyPatch.isNotEmpty) {
          final transport = (booking?.transport ?? const <Map<String, dynamic>>[])
              .asMap()
              .entries
              .map((e) {
            final t = Map<String, dynamic>.from(e.value);
            if (e.key == idx) t.addAll(moneyPatch);
            return t;
          }).toList();
          if (transport.isEmpty) {
            transport.add({...moneyPatch});
          }
          await updateBooking(bookingId, {'transport': transport});
        } else if (type == 'client') {
          final bookingMoney = <String, dynamic>{
            if (amountNum != null) 'totalAmount': amountNum,
            if (advanceNum != null) 'advanceReceived': advanceNum,
            if (remainingNum != null) ...{
              'remainingBalance': remainingNum,
              'pendingAmount': remainingNum,
            },
            if ((form['pickup'] ?? '').trim().isNotEmpty) 'pickup': form['pickup']!.trim(),
            if ((form['drop'] ?? '').trim().isNotEmpty) 'drop': form['drop']!.trim(),
            if ((form['packageName'] ?? '').trim().isNotEmpty) 'packageName': form['packageName']!.trim(),
          };
          if (bookingMoney.isNotEmpty) {
            await updateBooking(bookingId, bookingMoney);
          }
        }
      } catch (_) {
        // Booking sync is best-effort — voucher payload already saved.
      }
    }

    return regenerateVoucher(voucher.id);
  }

  /// POST /operations-manager/vouchers/:id/send-whatsapp — prepares PDF + wa.me payload.
  Future<Map<String, dynamic>> sendVoucherWhatsApp(
    String voucherId, {
    String? phone,
    bool showGuestPhone = true,
  }) async {
    final res = await _api.post(
      '$_base/vouchers/$voucherId/send-whatsapp',
      data: {
        if (phone != null && phone.trim().isNotEmpty) 'phone': phone.trim(),
        'showGuestPhone': showGuestPhone,
      },
      options: Options(
        receiveTimeout: const Duration(seconds: 90),
        sendTimeout: const Duration(seconds: 30),
      ),
    );
    final data = res.data;
    if (data is Map) return Map<String, dynamic>.from(data);
    return <String, dynamic>{};
  }

  /// POST /operations-manager/vouchers/:id/send-email
  Future<Map<String, dynamic>> sendVoucherEmail(
    String voucherId, {
    required String to,
    bool showGuestPhone = true,
  }) async {
    final res = await _api.post(
      '$_base/vouchers/$voucherId/send-email',
      data: {
        'to': to.trim(),
        'showGuestPhone': showGuestPhone,
      },
    );
    final data = res.data;
    if (data is Map) return Map<String, dynamic>.from(data);
    return <String, dynamic>{};
  }

  Future<List<OpsTask>> fetchOpsTasks() async {
    final res = await _api.get('$_base/tasks');
    return _listFrom(res.data).map(OpsTask.fromJson).toList();
  }

  Future<OpsBooking> confirmHotel(String bookingId) async {
    final res = await _api.post('$_base/bookings/$bookingId/confirm-hotel');
    final data = res.data;
    if (data is Map) return OpsBooking.fromJson(Map<String, dynamic>.from(data));
    throw Exception('Invalid confirm hotel response');
  }

  Future<OpsBooking> confirmCab(String bookingId) async {
    final res = await _api.post('$_base/bookings/$bookingId/confirm-cab');
    final data = res.data;
    if (data is Map) return OpsBooking.fromJson(Map<String, dynamic>.from(data));
    throw Exception('Invalid confirm cab response');
  }

  Future<OpsBooking> updateBooking(String bookingId, Map<String, dynamic> payload) async {
    final res = await _api.put('$_base/bookings/$bookingId', data: payload);
    final data = res.data;
    if (data is Map) {
      final inner = data['booking'] is Map ? data['booking'] as Map : data;
      return OpsBooking.fromJson(Map<String, dynamic>.from(inner));
    }
    throw Exception('Invalid booking update response');
  }

  Future<OpsBooking> renameHotel(String bookingId, String hotelName, {int index = 0}) async {
    final current = await fetchOpsBooking(bookingId);
    final hotels = current.hotels.map((h) => Map<String, dynamic>.from(h)).toList();
    if (hotels.isEmpty) {
      hotels.add({'hotelName': hotelName, 'name': hotelName, 'status': 'pending'});
    } else {
      final i = index.clamp(0, hotels.length - 1);
      hotels[i] = {
        ...hotels[i],
        'hotelName': hotelName,
        'name': hotelName,
      };
    }
    return updateBooking(bookingId, {'hotels': hotels});
  }
}
