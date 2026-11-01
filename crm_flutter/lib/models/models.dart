class User {
  final String id;
  final String name;
  final String email;
  final String? phone;
  final String role;
  final String? roleName;
  final String? companyId;
  final String? token;

  User({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    required this.role,
    this.roleName,
    this.companyId,
    this.token,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    final id = (json['_id'] ?? json['id'] ?? '').toString();
    return User(
      id: id,
      name: (json['name'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      phone: json['phone']?.toString(),
      role: (json['role'] ?? 'sales_executive').toString(),
      roleName: json['roleName']?.toString(),
      companyId: json['companyId']?.toString(),
      token: json['token']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        '_id': id,
        'id': id,
        'name': name,
        'email': email,
        'phone': phone,
        'role': role,
        'roleName': roleName,
        'companyId': companyId,
        if (token != null) 'token': token,
      };

  User copyWith({String? token}) => User(
        id: id,
        name: name,
        email: email,
        phone: phone,
        role: role,
        roleName: roleName,
        companyId: companyId,
        token: token ?? this.token,
      );
}

class Lead {
  final String id;
  final String? leadId;
  final String name;
  final String? email;
  final String? phone;
  final String? destination;
  final num? budget;
  final String status;
  final bool isHot;
  final String? source;
  final String? assignedToName;
  final String? createdAt;

  // Extended fields used by the CRM website Lead 360 page.
  final String? pickup;
  final String? drop;
  final String? cabType;
  final String? travelDate;
  final int? adults;
  final int? children;
  final int? travelers;
  final String? hotelCategory;
  final String? leadType;
  final String? lastContactedAt;
  final num? smartScore;
  final String? leadScore;
  final String? temperature;
  final String? whatsapp;
  final String? assignedToId;
  final String? statusReason;
  final String? nextFollowUp;
  final String? updatedAt;
  final String? createdByName;
  final String? notes;

  /// Full JSON payload as returned by the API (includes embedded followups/quotations
  /// when fetched with `includeRelated=true`).
  final Map<String, dynamic>? raw;

  Lead({
    required this.id,
    this.leadId,
    required this.name,
    this.email,
    this.phone,
    this.destination,
    this.budget,
    required this.status,
    this.isHot = false,
    this.source,
    this.assignedToName,
    this.createdAt,
    this.pickup,
    this.drop,
    this.cabType,
    this.travelDate,
    this.adults,
    this.children,
    this.travelers,
    this.hotelCategory,
    this.leadType,
    this.lastContactedAt,
    this.smartScore,
    this.leadScore,
    this.temperature,
    this.whatsapp,
    this.assignedToId,
    this.statusReason,
    this.nextFollowUp,
    this.updatedAt,
    this.createdByName,
    this.notes,
    this.raw,
  });

  factory Lead.fromJson(Map<String, dynamic> json) {
    String? opt(dynamic v) {
      if (v == null) return null;
      if (v is Map) {
        final n = v['name'] ?? v['label'];
        return n?.toString();
      }
      final s = v.toString();
      return (s.isEmpty || s == 'null') ? null : s;
    }

    int? optInt(dynamic v) {
      if (v == null) return null;
      if (v is num) return v.toInt();
      return int.tryParse(v.toString());
    }

    num? optNum(dynamic v) {
      if (v == null) return null;
      if (v is num) return v;
      return num.tryParse(v.toString());
    }

    String? assigned;
    String? assignedId;
    final a = json['assignedTo'];
    if (a is Map) {
      assigned = a['name']?.toString();
      assignedId = (a['_id'] ?? a['id'])?.toString();
    } else if (a is String && a.isNotEmpty) {
      assignedId = a;
    }
    final createdBy = json['createdBy'];
    return Lead(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      leadId: json['leadId']?.toString(),
      name: (json['name'] ?? 'Lead').toString(),
      email: json['email']?.toString(),
      phone: json['phone']?.toString(),
      destination: json['destination']?.toString(),
      budget: json['budget'] is num ? json['budget'] as num : num.tryParse('${json['budget'] ?? ''}'),
      status: (json['status'] ?? 'new').toString(),
      isHot: json['isHot'] == true,
      source: (json['source'] ?? json['leadSource'])?.toString(),
      assignedToName: assigned,
      createdAt: json['createdAt']?.toString(),
      pickup: opt(json['pickup']),
      drop: opt(json['drop']),
      cabType: opt(json['cabType'] ?? json['transportRequirement']),
      travelDate: opt(json['travelDate']),
      adults: optInt(json['adults']),
      children: optInt(json['children']),
      travelers: optInt(json['travelers']),
      hotelCategory: opt(json['hotelCategory']),
      leadType: opt(json['leadType']),
      lastContactedAt: opt(json['lastContactedAt']),
      smartScore: optNum(json['smartScore']),
      leadScore: opt(json['leadScore']),
      temperature: opt(json['temperature']),
      whatsapp: opt(json['whatsapp']),
      assignedToId: assignedId,
      statusReason: opt(json['statusReason']),
      nextFollowUp: opt(json['nextFollowUp']),
      updatedAt: opt(json['updatedAt']),
      createdByName: createdBy is Map ? createdBy['name']?.toString() : null,
      notes: json['notes'] is String ? opt(json['notes']) : null,
      raw: Map<String, dynamic>.from(json),
    );
  }
}

class FollowUp {
  final String id;
  final String scheduledAt;
  final String? status;
  final String? priority;
  final String? notes;
  final String? type;
  final String? leadId;
  final String? leadName;
  final String? leadPhone;
  final String? destination;

  FollowUp({
    required this.id,
    required this.scheduledAt,
    this.status,
    this.priority,
    this.notes,
    this.type,
    this.leadId,
    this.leadName,
    this.leadPhone,
    this.destination,
  });

  factory FollowUp.fromJson(Map<String, dynamic> json) {
    String? leadId;
    String? leadName;
    String? leadPhone;
    String? destination;
    final lead = json['lead'];
    if (lead is Map) {
      leadId = (lead['_id'] ?? lead['id'])?.toString();
      leadName = lead['name']?.toString();
      leadPhone = lead['phone']?.toString();
      destination = lead['destination']?.toString();
    } else if (lead is String) {
      leadId = lead;
    }
    return FollowUp(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      scheduledAt: (json['scheduledAt'] ?? '').toString(),
      status: json['status']?.toString(),
      priority: json['priority']?.toString(),
      notes: json['notes']?.toString(),
      type: json['type']?.toString(),
      leadId: leadId,
      leadName: leadName ?? json['customer']?.toString() ?? json['customerName']?.toString(),
      leadPhone: leadPhone,
      destination: destination ?? json['destination']?.toString(),
    );
  }
}

class Quotation {
  final String id;
  final String? quoteNumber;
  final String? status;
  final num total;
  final String packageName;
  final String? leadId;
  final String? leadName;
  final String? leadPhone;
  final String? leadEmail;
  final String? leadDestination;
  final String? leadTravelDate;
  final String? destination;
  final int adults;
  final int children;
  final String? createdAt;
  final String? sentAt;
  final String? pdfUrl;

  Quotation({
    required this.id,
    this.quoteNumber,
    this.status,
    required this.total,
    required this.packageName,
    this.leadId,
    this.leadName,
    this.leadPhone,
    this.leadEmail,
    this.leadDestination,
    this.leadTravelDate,
    this.destination,
    this.adults = 0,
    this.children = 0,
    this.createdAt,
    this.sentAt,
    this.pdfUrl,
  });

  factory Quotation.fromJson(Map<String, dynamic> json) {
    final pricing = json['pricing'] is Map ? json['pricing'] as Map : {};
    final costing = json['costing'] is Map ? json['costing'] as Map : {};
    final packageInfo = json['packageInfo'] is Map ? json['packageInfo'] as Map : {};
    final packageSnapshot = json['packageSnapshot'] is Map ? json['packageSnapshot'] as Map : {};
    final package = json['package'];
    String packageName = packageInfo['packageName']?.toString() ??
        packageSnapshot['name']?.toString() ??
        '';
    if (packageName.isEmpty && package is Map) {
      packageName = package['name']?.toString() ?? '';
    }
    if (packageName.isEmpty) {
      packageName = packageInfo['destination']?.toString() ?? 'Package';
    }

    String? leadId;
    String? leadName;
    String? leadPhone;
    String? leadEmail;
    String? leadDestination;
    String? leadTravelDate;
    final lead = json['lead'];
    if (lead is Map) {
      leadId = (lead['_id'] ?? lead['id'])?.toString();
      leadName = lead['name']?.toString();
      leadPhone = (lead['whatsapp'] ?? lead['phone'])?.toString();
      leadEmail = lead['email']?.toString();
      leadDestination = lead['destination']?.toString();
      leadTravelDate = lead['travelDate']?.toString();
    } else if (lead is String && lead.isNotEmpty) {
      leadId = lead;
    }

    final dest = packageInfo['destination']?.toString()
        ?? packageSnapshot['destination']?.toString()
        ?? leadDestination;

    final adultsRaw = packageInfo['adults'];
    final childrenRaw = packageInfo['children'];
    final adults = adultsRaw is num
        ? adultsRaw.toInt()
        : int.tryParse('${adultsRaw ?? ''}') ?? 0;
    final children = childrenRaw is num
        ? childrenRaw.toInt()
        : int.tryParse('${childrenRaw ?? ''}') ?? 0;

    final total = pricing['total'] ??
        pricing['grandTotal'] ??
        costing['grandTotal'] ??
        0;

    return Quotation(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      quoteNumber: json['quoteNumber']?.toString(),
      status: json['status']?.toString(),
      total: total is num ? total : num.tryParse('$total') ?? 0,
      packageName: packageName,
      leadId: leadId,
      leadName: leadName,
      leadPhone: leadPhone,
      leadEmail: leadEmail,
      leadDestination: leadDestination,
      leadTravelDate: leadTravelDate,
      destination: dest,
      adults: adults,
      children: children,
      createdAt: json['createdAt']?.toString(),
      sentAt: json['sentAt']?.toString(),
      pdfUrl: json['pdfUrl']?.toString(),
    );
  }
}

class DashboardData {
  final Map<String, num> kpis;
  final List<Lead> recentLeads;
  final List<Map<String, dynamic>> todayTasks;

  DashboardData({
    required this.kpis,
    required this.recentLeads,
    required this.todayTasks,
  });

  factory DashboardData.empty() => DashboardData(kpis: {}, recentLeads: [], todayTasks: []);

  factory DashboardData.fromJson(Map<String, dynamic> raw) {
    final nested = raw['kpis'] is Map ? Map<String, dynamic>.from(raw['kpis'] as Map) : <String, dynamic>{};
    num n(dynamic v) {
      if (v is num) return v;
      if (v is String) return num.tryParse(v) ?? 0;
      if (v is List) return v.length;
      return 0;
    }

    final kpis = <String, num>{
      'totalLeads': n(nested['totalLeads'] ?? nested['myLeads'] ?? raw['totalLeads']),
      'hotLeads': n(nested['hotLeads'] ?? raw['hotLeads']),
      'todayFollowups': n(nested['todayFollowups'] ?? nested['followUpsToday'] ?? raw['followUpsToday']),
      'convertedLeads': n(nested['convertedLeads'] ?? raw['convertedLeads']),
      'quotationsSent': n(nested['quotationsSent'] ?? raw['quotationsSent']),
      'revenue': n(nested['monthlyRevenue'] ?? nested['revenue'] ?? raw['revenue']),
      'overdueFollowups': n(nested['overdueFollowups'] ?? raw['overdueFollowups']),
      'newLeadsToday': n(nested['newLeadsToday'] ?? raw['newLeadsToday']),
    };

    final recent = <Lead>[];
    final rawRecent = raw['recentLeads'];
    if (rawRecent is List) {
      for (final item in rawRecent) {
        if (item is Map) recent.add(Lead.fromJson(Map<String, dynamic>.from(item)));
      }
    }

    final tasks = <Map<String, dynamic>>[];
    final rawTasks = raw['todayTasks'] ?? raw['todayFollowUps'];
    if (rawTasks is List) {
      for (final item in rawTasks) {
        if (item is Map) tasks.add(Map<String, dynamic>.from(item));
      }
    }

    return DashboardData(kpis: kpis, recentLeads: recent, todayTasks: tasks);
  }
}

class AppNotification {
  final String id;
  final String title;
  final String? message;
  final bool read;
  final String createdAt;
  final String? type;
  final Map<String, dynamic>? meta;

  AppNotification({
    required this.id,
    required this.title,
    this.message,
    required this.read,
    required this.createdAt,
    this.type,
    this.meta,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) => AppNotification(
        id: (json['_id'] ?? json['id'] ?? '').toString(),
        title: (json['title'] ?? 'Notification').toString(),
        message: json['message']?.toString(),
        read: json['read'] == true || json['isRead'] == true,
        createdAt: (json['createdAt'] ?? '').toString(),
        type: (json['type'] ?? json['category'])?.toString(),
        meta: json['meta'] is Map ? Map<String, dynamic>.from(json['meta'] as Map) : null,
      );
}

class PaginatedResult<T> {
  final List<T> items;
  final int total;
  final int page;
  final int limit;

  PaginatedResult({
    required this.items,
    required this.total,
    required this.page,
    required this.limit,
  });
}

// ---------------------------------------------------------------------------
// Quotation detail (full document) — ported from crm-mobile Quotation type.
// ---------------------------------------------------------------------------

String _txt(dynamic v, [String fallback = '']) {
  if (v == null) return fallback;
  if (v is Map) return (v['name'] ?? v['label'] ?? fallback).toString();
  final s = v.toString();
  return s.isEmpty ? fallback : s;
}

num _num(dynamic v) {
  if (v is num) return v;
  return num.tryParse('${v ?? ''}') ?? 0;
}

Map<String, dynamic> _map(dynamic v) =>
    v is Map ? Map<String, dynamic>.from(v) : <String, dynamic>{};

List<Map<String, dynamic>> _mapList(dynamic v) => v is List
    ? v.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
    : <Map<String, dynamic>>[];

class QuotationDetail {
  QuotationDetail(this.raw);
  final Map<String, dynamic> raw;

  String get id => _txt(raw['_id'] ?? raw['id']);
  String get quoteNumber => _txt(raw['quoteNumber']);
  String get status => _txt(raw['status'], 'draft');
  String? get pdfUrl {
    final u = _txt(raw['pdfUrl']);
    return u.isEmpty ? null : u;
  }

  Map<String, dynamic> get packageInfo => _map(raw['packageInfo']);
  Map<String, dynamic> get packageSnapshot => _map(raw['packageSnapshot']);
  Map<String, dynamic> get pricing => _map(raw['pricing']);
  Map<String, dynamic> get costing => _map(raw['costing']);
  Map<String, dynamic> get importantNotes => _map(raw['importantNotes']);

  String? get leadId {
    final l = raw['lead'];
    if (l is Map) return _txt(l['_id'] ?? l['id']);
    if (l is String) return l;
    return null;
  }

  String get leadName => raw['lead'] is Map ? _txt((raw['lead'] as Map)['name'], 'Lead') : 'Lead';
  String get leadPhone => raw['lead'] is Map ? _txt((raw['lead'] as Map)['phone']) : '';

  String get packageName {
    final a = _txt(packageInfo['packageName']);
    if (a.isNotEmpty) return a;
    final b = _txt(packageSnapshot['name']);
    if (b.isNotEmpty) return b;
    final p = raw['package'];
    if (p is Map && _txt(p['name']).isNotEmpty) return _txt(p['name']);
    return _txt(packageInfo['destination'], 'Package');
  }

  String get destination =>
      _txt(packageInfo['destination'], _txt(packageSnapshot['destination']));
  int get duration => _num(packageInfo['duration'] ?? packageSnapshot['duration']).toInt();
  int get adults => _num(packageInfo['adults']).toInt();
  int get children => _num(packageInfo['children']).toInt();
  String get mealPlan => _txt(packageInfo['mealPlan']);
  String get hotelCategory => _txt(packageInfo['hotelCategory']);
  String get travelDate => _txt(packageInfo['travelDate']);

  num get total {
    final t = _num(pricing['total']);
    if (t > 0) return t;
    final g = _num(pricing['grandTotal']);
    if (g > 0) return g;
    return _num(costing['grandTotal']);
  }

  String get notes => _txt(importantNotes['travelGuidelines'], _txt(raw['customizations']));
  String get createdAt => _txt(raw['createdAt']);
  String get sentAt => _txt(raw['sentAt']);

  List<Map<String, dynamic>> get itinerary => _mapList(packageSnapshot['itinerary']);
  List<Map<String, dynamic>> get paymentPlan => _mapList(raw['paymentPlan']);
  List<Map<String, dynamic>> get selectedHotels => _mapList(raw['selectedHotels']);
  List<Map<String, dynamic>> get selectedCabs => _mapList(raw['selectedCabs']);
}

// ---------------------------------------------------------------------------
// Operations (operations-manager API)
// ---------------------------------------------------------------------------

class OpsBooking {
  final String id;
  final String? bookingNumber;
  final String? customerName;
  final String? customerPhone;
  final String? customerEmail;
  final String? destination;
  final String? packageName;
  final String? travelDate;
  final String? returnDate;
  final String status;
  final num totalAmount;
  final num advanceReceived;
  final num remainingBalance;
  final String? hotelConfirmation;
  final String? cabConfirmation;
  final String? voucherStatus;
  final int adults;
  final int children;
  final List<Map<String, dynamic>> hotels;
  final List<Map<String, dynamic>> transport;
  final List<OpsTask> tasks;

  OpsBooking({
    required this.id,
    this.bookingNumber,
    this.customerName,
    this.customerPhone,
    this.customerEmail,
    this.destination,
    this.packageName,
    this.travelDate,
    this.returnDate,
    this.status = 'pending',
    this.totalAmount = 0,
    this.advanceReceived = 0,
    this.remainingBalance = 0,
    this.hotelConfirmation,
    this.cabConfirmation,
    this.voucherStatus,
    this.adults = 0,
    this.children = 0,
    this.hotels = const [],
    this.transport = const [],
    this.tasks = const [],
  });

  factory OpsBooking.fromJson(Map<String, dynamic> j) {
    String? opt(dynamic v) {
      final s = _txt(v);
      return s.isEmpty ? null : s;
    }

    return OpsBooking(
      id: _txt(j['_id'] ?? j['id']),
      bookingNumber: opt(j['bookingNumber']),
      customerName: opt(j['customerName']),
      customerPhone: opt(j['customerPhone']),
      customerEmail: opt(j['customerEmail']),
      destination: opt(j['destination']),
      packageName: opt(j['packageName']),
      travelDate: opt(j['travelDate']),
      returnDate: opt(j['returnDate']),
      status: _txt(j['status'], 'pending'),
      totalAmount: _num(j['totalAmount']),
      advanceReceived: _num(j['advanceReceived']),
      remainingBalance: _num(j['remainingBalance']),
      hotelConfirmation: opt(j['hotelConfirmation']),
      cabConfirmation: opt(j['cabConfirmation']),
      voucherStatus: opt(j['voucherStatus']),
      adults: _num(j['adults']).toInt(),
      children: _num(j['children']).toInt(),
      hotels: _mapList(j['hotels']),
      transport: _mapList(j['transport']),
      tasks: _mapList(j['tasks']).map(OpsTask.fromJson).toList(),
    );
  }
}

class OpsTask {
  final String id;
  final String title;
  final String? status;
  final String? dueDate;
  final String? priority;
  final String? notes;

  OpsTask({
    required this.id,
    required this.title,
    this.status,
    this.dueDate,
    this.priority,
    this.notes,
  });

  factory OpsTask.fromJson(Map<String, dynamic> j) => OpsTask(
        id: _txt(j['_id'] ?? j['id']),
        title: _txt(j['title'], 'Task'),
        status: j['status']?.toString(),
        dueDate: j['dueDate']?.toString(),
        priority: j['priority']?.toString(),
        notes: j['notes']?.toString(),
      );
}

class OpsVoucher {
  final String id;
  final String? voucherNumber;
  final String? type;
  final String? status;
  final String? createdAt;
  final String? sentAt;
  final String? bookingId;
  final String? bookingNumber;
  final String? customerName;
  final String? customerPhone;
  final String? customerEmail;
  final String? destination;
  final int assignmentIndex;
  final int version;
  final bool isActive;
  final Map<String, dynamic> payload;
  final Map<String, dynamic> delivery;
  final String? pdfUrl;
  final String? vendorStatus;

  OpsVoucher({
    required this.id,
    this.voucherNumber,
    this.type,
    this.status,
    this.createdAt,
    this.sentAt,
    this.bookingId,
    this.bookingNumber,
    this.customerName,
    this.customerPhone,
    this.customerEmail,
    this.destination,
    this.assignmentIndex = 0,
    this.version = 1,
    this.isActive = true,
    this.payload = const {},
    this.delivery = const {},
    this.pdfUrl,
    this.vendorStatus,
  });

  String get title {
    final p = payload;
    final hotel = _txt(p['hotelName'] ?? p['name']);
    if (hotel.isNotEmpty) return hotel;
    final vehicle = _txt(p['vehicleDisplayName'] ?? p['vehicleType'] ?? p['vehicleName']);
    if (vehicle.isNotEmpty) return vehicle;
    final pkg = _txt(p['packageName']);
    if (pkg.isNotEmpty) return pkg;
    return voucherNumber ?? prettyType;
  }

  String get prettyType {
    final t = (type ?? '').toLowerCase();
    if (t == 'transport' || t == 'cab') return 'Cab';
    if (t == 'hotel') return 'Hotel';
    if (t == 'client') return 'Client';
    if (t == 'travel_kit' || t == 'travel-kit') return 'Travel kit';
    if (t.isEmpty) return 'Voucher';
    return t[0].toUpperCase() + t.substring(1);
  }

  bool get whatsappSent {
    final wa = delivery['whatsapp'];
    if (wa is Map && _txt(wa['status']).toLowerCase() == 'sent') return true;
    if ((status ?? '').toLowerCase() == 'sent' && (sentAt ?? '').isNotEmpty) {
      // Status sent but channel unknown — treat as sent if WA time exists
      if (wa is Map && _txt(wa['sentAt']).isNotEmpty) return true;
    }
    return wa is Map && _txt(wa['sentAt']).isNotEmpty;
  }

  bool get emailSent {
    final em = delivery['email'];
    if (em is Map && _txt(em['status']).toLowerCase() == 'sent') return true;
    return em is Map && _txt(em['sentAt']).isNotEmpty;
  }

  factory OpsVoucher.fromJson(Map<String, dynamic> j) {
    final b = j['booking'];
    String? bookingId;
    if (b is Map) {
      bookingId = _txt(b['_id'] ?? b['id']);
      if (bookingId.isEmpty) bookingId = null;
    } else if (b is String && b.isNotEmpty) {
      bookingId = b;
    }

    return OpsVoucher(
      id: _txt(j['_id'] ?? j['id']),
      voucherNumber: j['voucherNumber']?.toString(),
      type: j['type']?.toString(),
      status: j['status']?.toString(),
      createdAt: j['createdAt']?.toString(),
      sentAt: j['sentAt']?.toString(),
      bookingId: bookingId,
      bookingNumber: b is Map ? b['bookingNumber']?.toString() : null,
      customerName: b is Map ? b['customerName']?.toString() : j['customerName']?.toString(),
      customerPhone: b is Map ? b['customerPhone']?.toString() : j['customerPhone']?.toString(),
      customerEmail: b is Map ? b['customerEmail']?.toString() : j['customerEmail']?.toString(),
      destination: b is Map ? b['destination']?.toString() : j['destination']?.toString(),
      assignmentIndex: _num(j['assignmentIndex']).toInt(),
      version: _num(j['version'] ?? 1).toInt(),
      isActive: j['isActive'] != false,
      payload: _map(j['payload']),
      delivery: _map(j['delivery']),
      pdfUrl: j['pdfUrl']?.toString(),
      vendorStatus: j['vendorStatus']?.toString(),
    );
  }
}

/// GET /operations-manager/bookings/:id/execution — CRM voucher hub payload.
class OpsBookingExecution {
  final OpsBooking booking;
  final List<OpsVoucher> vouchers;
  final List<OpsVoucher> activeVouchers;
  final String? voucherStatus;
  final String? operationStatus;

  OpsBookingExecution({
    required this.booking,
    this.vouchers = const [],
    this.activeVouchers = const [],
    this.voucherStatus,
    this.operationStatus,
  });

  factory OpsBookingExecution.fromJson(Map<String, dynamic> j) {
    final bookingRaw = j['booking'] is Map
        ? Map<String, dynamic>.from(j['booking'] as Map)
        : <String, dynamic>{};
    final all = _mapList(j['vouchers']).map(OpsVoucher.fromJson).toList();
    final activeRaw = j['activeVouchers'];
    final active = activeRaw is List
        ? _mapList(activeRaw).map(OpsVoucher.fromJson).toList()
        : all.where((v) => v.isActive).toList();
    return OpsBookingExecution(
      booking: OpsBooking.fromJson(bookingRaw),
      vouchers: all,
      activeVouchers: active,
      voucherStatus: j['voucherStatus']?.toString() ?? bookingRaw['voucherStatus']?.toString(),
      operationStatus: j['operationStatus']?.toString(),
    );
  }
}

class OpsAlert {
  final String title;
  final String? timeAgo;
  final String? tone;
  OpsAlert({required this.title, this.timeAgo, this.tone});

  factory OpsAlert.fromJson(Map<String, dynamic> j) => OpsAlert(
        title: _txt(j['title'], 'Alert'),
        timeAgo: j['timeAgo']?.toString(),
        tone: j['tone']?.toString(),
      );
}

class OpsDashboard {
  final Map<String, num> kpis;
  final List<OpsBooking> newBookings;
  final List<OpsBooking> upcomingTrips;
  final List<OpsAlert> alerts;

  OpsDashboard({
    required this.kpis,
    required this.newBookings,
    required this.upcomingTrips,
    required this.alerts,
  });

  factory OpsDashboard.empty() =>
      OpsDashboard(kpis: {}, newBookings: [], upcomingTrips: [], alerts: []);

  factory OpsDashboard.fromJson(Map<String, dynamic> j) {
    final k = _map(j['kpis']);
    final kpis = <String, num>{for (final e in k.entries) e.key: _num(e.value)};
    final newB = _mapList(j['newBookings']);
    return OpsDashboard(
      kpis: kpis,
      newBookings: (newB.isNotEmpty ? newB : _mapList(j['recentBookings']))
          .map(OpsBooking.fromJson)
          .toList(),
      upcomingTrips: _mapList(j['upcomingTrips']).map(OpsBooking.fromJson).toList(),
      alerts: _mapList(j['alerts']).map(OpsAlert.fromJson).toList(),
    );
  }
}

/// Assignee for lead assignment (sales manager / team leader / executive).
class Assignee {
  final String id;
  final String name;
  final String role;
  Assignee({required this.id, required this.name, required this.role});

  factory Assignee.fromJson(Map<String, dynamic> j, String role) => Assignee(
        id: _txt(j['_id'] ?? j['id']),
        name: _txt(j['name'], 'User'),
        role: _txt(j['role'], role),
      );
}
