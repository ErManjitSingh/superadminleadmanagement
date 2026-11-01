import 'dart:async';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../core/emb_theme.dart';
import '../models/models.dart';
import '../providers/auth_provider.dart';
import '../services/ai_itinerary_service.dart';
import '../services/leads_service.dart';
import '../services/quotation_pdf_builder.dart';
import '../services/quotation_web_html.dart' show stripMealMentionsFromItinerary;
import '../services/quote_draft_store.dart';
import '../services/quotations_service.dart';
import '../services/whatsapp_pdf_share.dart';
import '../widgets/common_widgets.dart' show formatMoney, EmptyState;
import '../widgets/emb_widgets.dart';
import 'quotation_pdf_preview_screen.dart';

const _mealPlans = ['CP', 'MAP', 'AP', 'EP', 'No Hotel (Cab Only)'];
const _hotelCategories = ['Budget', '3 Star', '4 Star', '5 Star', 'Luxury', 'Boutique'];
const _vehicles = [
  'Sedan (Dzire/Etios)',
  'SUV',
  'Innova Crysta',
  '4x4 Cab',
  'Maruti Jimny',
  'Hilux',
  'Tempo Traveller (12 Seater)',
  'Tempo Traveller (17 Seater)',
  'Urbania',
  'Bus (55 Seater)',
];

class _Step {
  const _Step(this.id, this.title, this.icon);
  final int id;
  final String title;
  final IconData icon;
}

const _steps = [
  _Step(1, 'Package', Icons.work_outline),
  _Step(2, 'AI Itinerary', Icons.auto_awesome),
  _Step(3, 'Hotels', Icons.bed_outlined),
  _Step(4, 'Transport', Icons.directions_car_outlined),
  _Step(5, 'Pricing', Icons.payments_outlined),
  _Step(6, 'Preview', Icons.visibility_outlined),
];

class _DayEditor {
  _DayEditor({String title = '', String description = ''})
      : title = TextEditingController(text: title),
        description = TextEditingController(text: description);
  final TextEditingController title;
  final TextEditingController description;
  void dispose() {
    title.dispose();
    description.dispose();
  }
}

class _HotelEditor {
  _HotelEditor({String name = '', String nights = '2', String roomType = 'Double'})
      : name = TextEditingController(text: name),
        nights = TextEditingController(text: nights),
        roomType = TextEditingController(text: roomType);
  final TextEditingController name;
  final TextEditingController nights;
  final TextEditingController roomType;
  void dispose() {
    name.dispose();
    nights.dispose();
    roomType.dispose();
  }
}

class _CabEditor {
  _CabEditor({this.vehicle = 'Sedan (Dzire/Etios)', String cost = '0', String count = '1'})
      : cost = TextEditingController(text: cost),
        count = TextEditingController(text: count);
  String vehicle;
  final TextEditingController cost;
  final TextEditingController count;
  void dispose() {
    cost.dispose();
    count.dispose();
  }
}

/// Native 6-step quotation builder (Package, Itinerary, Hotels, Transport, Pricing, Preview).
/// Pops with `true` after a successful save.
class QuoteBuilderScreen extends StatefulWidget {
  const QuoteBuilderScreen({super.key, this.leadId, this.leadName, this.quoteId});
  final String? leadId;
  final String? leadName;
  final String? quoteId;

  @override
  State<QuoteBuilderScreen> createState() => _QuoteBuilderScreenState();
}

class _QuoteBuilderScreenState extends State<QuoteBuilderScreen> with WidgetsBindingObserver {
  int _step = 1;
  String _leadId = '';
  String _leadName = '';
  String _leadPhone = '';
  String _quoteId = '';
  bool _loadingExisting = false;
  bool _saving = false;
  bool _sharing = false;
  bool _didSave = false;
  String? _savedNumber;
  Timer? _localDraftDebounce;

  final _packageName = TextEditingController();
  final _destination = TextEditingController();
  final _duration = TextEditingController(text: '5');
  final _adults = TextEditingController(text: '2');
  final _children = TextEditingController(text: '0');
  final _amount = TextEditingController();
  final _notes = TextEditingController();
  final _aiPrompt = TextEditingController();
  String _mealPlan = 'MAP';
  String _hotelCategory = '3 Star';
  DateTime _travelDate = DateTime.now().add(const Duration(days: 14));

  final List<_DayEditor> _days = [_DayEditor(title: 'Arrival & sightseeing')];
  final List<_HotelEditor> _hotels = [_HotelEditor()];
  final List<_CabEditor> _cabs = [_CabEditor()];

  bool _aiGenerating = false;
  int _aiSeed = 0;
  String? _aiError;
  String? _aiWarning;
  String? _aiPickup;
  String? _aiDrop;

  bool get _noHotel =>
      RegExp(r'no hotel|cab only', caseSensitive: false).hasMatch(_mealPlan);
  List<_Step> get _visible => _steps.where((s) => !(_noHotel && s.id == 3)).toList();
  String get _role => context.read<AuthProvider>().user?.role ?? 'sales_executive';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _leadId = widget.leadId ?? '';
    _leadName = widget.leadName ?? '';
    _quoteId = widget.quoteId ?? '';
    if (_quoteId.isNotEmpty) {
      _loadingExisting = true;
      WidgetsBinding.instance.addPostFrameCallback((_) => _loadExisting());
    } else if (_leadId.isNotEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) async {
        await _loadLead();
        await _tryRestoreLocalDraft();
      });
    } else {
      WidgetsBinding.instance.addPostFrameCallback((_) => _tryRestoreLocalDraft());
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.inactive ||
        state == AppLifecycleState.paused ||
        state == AppLifecycleState.hidden) {
      unawaited(_persistLocalDraft(silentServer: true));
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _localDraftDebounce?.cancel();
    // Snapshot BEFORE disposing controllers (async save must not read disposed fields).
    if (!_loadingExisting && (_leadId.isNotEmpty || _quoteId.isNotEmpty)) {
      final snap = _serializeLocalDraft();
      final qid = _quoteId.isEmpty ? null : _quoteId;
      final lid = _leadId.isEmpty ? null : _leadId;
      unawaited(QuoteDraftStore.save(snap, quoteId: qid, leadId: lid));
    }
    for (final c in [_packageName, _destination, _duration, _adults, _children, _amount, _notes, _aiPrompt]) {
      c.dispose();
    }
    for (final d in _days) {
      d.dispose();
    }
    for (final h in _hotels) {
      h.dispose();
    }
    for (final c in _cabs) {
      c.dispose();
    }
    super.dispose();
  }

  void _scheduleLocalDraftSave() {
    _localDraftDebounce?.cancel();
    _localDraftDebounce = Timer(const Duration(milliseconds: 700), () {
      unawaited(_persistLocalDraft());
    });
  }

  Map<String, dynamic> _serializeLocalDraft() => {
        'step': _step,
        'leadId': _leadId,
        'leadName': _leadName,
        'leadPhone': _leadPhone,
        'quoteId': _quoteId,
        'savedNumber': _savedNumber,
        'packageName': _packageName.text,
        'destination': _destination.text,
        'duration': _duration.text,
        'adults': _adults.text,
        'children': _children.text,
        'amount': _amount.text,
        'notes': _notes.text,
        'aiPrompt': _aiPrompt.text,
        'mealPlan': _mealPlan,
        'hotelCategory': _hotelCategory,
        'travelDate': _travelDate.toIso8601String(),
        'days': [
          for (final d in _days) {'title': d.title.text, 'description': d.description.text},
        ],
        'hotels': [
          for (final h in _hotels)
            {'name': h.name.text, 'nights': h.nights.text, 'roomType': h.roomType.text},
        ],
        'cabs': [
          for (final c in _cabs) {'vehicle': c.vehicle, 'cost': c.cost.text, 'count': c.count.text},
        ],
      };

  void _applyLocalDraft(Map<String, dynamic> d) {
    _step = (d['step'] as num?)?.toInt() ?? _step;
    if ((d['leadId'] ?? '').toString().isNotEmpty) _leadId = d['leadId'].toString();
    if ((d['leadName'] ?? '').toString().isNotEmpty) _leadName = d['leadName'].toString();
    if ((d['leadPhone'] ?? '').toString().isNotEmpty) _leadPhone = d['leadPhone'].toString();
    if ((d['quoteId'] ?? '').toString().isNotEmpty) _quoteId = d['quoteId'].toString();
    final sn = d['savedNumber']?.toString();
    if (sn != null && sn.isNotEmpty) _savedNumber = sn;
    _packageName.text = d['packageName']?.toString() ?? _packageName.text;
    _destination.text = d['destination']?.toString() ?? _destination.text;
    _duration.text = d['duration']?.toString() ?? _duration.text;
    _adults.text = d['adults']?.toString() ?? _adults.text;
    _children.text = d['children']?.toString() ?? _children.text;
    _amount.text = d['amount']?.toString() ?? _amount.text;
    _notes.text = d['notes']?.toString() ?? _notes.text;
    _aiPrompt.text = d['aiPrompt']?.toString() ?? _aiPrompt.text;
    if ((d['mealPlan'] ?? '').toString().isNotEmpty) _mealPlan = d['mealPlan'].toString();
    if ((d['hotelCategory'] ?? '').toString().isNotEmpty) _hotelCategory = d['hotelCategory'].toString();
    final td = DateTime.tryParse(d['travelDate']?.toString() ?? '');
    if (td != null) _travelDate = td;

    final days = d['days'];
    if (days is List && days.isNotEmpty) {
      for (final x in _days) {
        x.dispose();
      }
      _days
        ..clear()
        ..addAll(days.whereType<Map>().map((e) => _DayEditor(
              title: '${e['title'] ?? ''}',
              description: '${e['description'] ?? ''}',
            )));
    }
    final hotels = d['hotels'];
    if (hotels is List && hotels.isNotEmpty) {
      for (final x in _hotels) {
        x.dispose();
      }
      _hotels
        ..clear()
        ..addAll(hotels.whereType<Map>().map((e) => _HotelEditor(
              name: '${e['name'] ?? ''}',
              nights: '${e['nights'] ?? 1}',
              roomType: '${e['roomType'] ?? ''}',
            )));
    }
    final cabs = d['cabs'];
    if (cabs is List && cabs.isNotEmpty) {
      for (final x in _cabs) {
        x.dispose();
      }
      _cabs
        ..clear()
        ..addAll(cabs.whereType<Map>().map((e) => _CabEditor(
              vehicle: '${e['vehicle'] ?? _vehicles.first}',
              cost: '${e['cost'] ?? 0}',
              count: '${e['count'] ?? 1}',
            )));
    }
  }

  Future<void> _tryRestoreLocalDraft() async {
    final draft = await QuoteDraftStore.load(
      quoteId: _quoteId.isEmpty ? null : _quoteId,
      leadId: _leadId.isEmpty ? null : _leadId,
    );
    if (draft == null || !mounted) return;
    // Don't overwrite a freshly loaded server quote with empty local junk.
    final hasContent = (draft['packageName']?.toString().trim().isNotEmpty == true) ||
        (draft['amount']?.toString().trim().isNotEmpty == true) ||
        (draft['days'] is List && (draft['days'] as List).isNotEmpty &&
            ((draft['days'] as List).first is Map) &&
            (((draft['days'] as List).first as Map)['title']?.toString().trim().isNotEmpty == true));
    if (!hasContent) return;
    setState(() => _applyLocalDraft(draft));
    if (mounted) {
      embSnack(context, 'Previous quotation draft restored');
    }
  }

  Future<void> _persistLocalDraft({bool silentServer = false}) async {
    if (_leadId.isEmpty && _quoteId.isEmpty) return;
    // Avoid saving while initial load in progress.
    if (_loadingExisting) return;
    try {
      await QuoteDraftStore.save(
        _serializeLocalDraft(),
        quoteId: _quoteId.isEmpty ? null : _quoteId,
        leadId: _leadId.isEmpty ? null : _leadId,
      );
    } catch (_) {}

    if (!silentServer || _leadId.isEmpty) return;
    // Best-effort server draft so CRM also keeps progress.
    try {
      if (!mounted) return;
      final saved = await context.read<QuotationsService>().saveQuotationBuilder(
            _role,
            _payload(true),
          );
      if (!mounted) return;
      if (saved.id.isNotEmpty) {
        _quoteId = saved.id;
        _savedNumber = saved.quoteNumber.isEmpty ? _savedNumber : saved.quoteNumber;
        await QuoteDraftStore.save(
          _serializeLocalDraft(),
          quoteId: _quoteId,
          leadId: _leadId,
        );
      }
    } catch (_) {}
  }

  Future<void> _clearLocalDraft() async {
    await QuoteDraftStore.clear(
      quoteId: _quoteId.isEmpty ? null : _quoteId,
      leadId: _leadId.isEmpty ? null : _leadId,
    );
  }

  Future<void> _loadLead() async {
    try {
      final lead = await context.read<LeadsService>().fetchLeadDetail(_role, _leadId);
      if (!mounted) return;
      _applyLead(lead, overwrite: false);
    } catch (_) {}
  }

  void _applyLead(Lead lead, {bool overwrite = true}) {
    setState(() {
      _leadId = lead.id;
      _leadName = lead.name;
      if ((lead.phone ?? '').trim().isNotEmpty) _leadPhone = lead.phone!.trim();
      if (overwrite || _destination.text.isEmpty) _destination.text = lead.destination ?? '';
      if (overwrite || _packageName.text.isEmpty) _packageName.text = lead.destination ?? '';
      if ((overwrite || _amount.text.isEmpty) && lead.budget != null && lead.budget! > 0) {
        _amount.text = lead.budget!.round().toString();
      }
    });
  }

  Future<void> _loadExisting() async {
    try {
      final q = await context.read<QuotationsService>().fetchQuotation(_role, _quoteId);
      if (!mounted) return;
      setState(() {
        _quoteId = q.id;
        if (q.leadId != null && q.leadId!.isNotEmpty) _leadId = q.leadId!;
        if (q.leadName != 'Lead') _leadName = q.leadName;
        if (q.leadPhone.isNotEmpty) _leadPhone = q.leadPhone;
        _savedNumber = q.quoteNumber.isEmpty ? null : q.quoteNumber;
        _packageName.text = q.packageName;
        _destination.text = q.destination;
        _duration.text = '${q.duration > 0 ? q.duration : 5}';
        _adults.text = '${q.adults > 0 ? q.adults : 2}';
        _children.text = '${q.children}';
        if (q.mealPlan.isNotEmpty) _mealPlan = q.mealPlan;
        if (q.hotelCategory.isNotEmpty) _hotelCategory = q.hotelCategory;
        final parsed = DateTime.tryParse(q.travelDate);
        if (parsed != null) _travelDate = parsed;
        if (q.total > 0) _amount.text = q.total.round().toString();
        _notes.text = q.notes;

        if (q.itinerary.isNotEmpty) {
          for (final d in _days) {
            d.dispose();
          }
          _days
            ..clear()
            ..addAll(q.itinerary.asMap().entries.map((e) {
                  final desc = '${e.value['description'] ?? e.value['activities'] ?? ''}'.trim();
                  return _DayEditor(
                    title: '${e.value['title'] ?? e.value['name'] ?? 'Day ${e.key + 1}'}',
                    description: desc,
                  );
                }));
        }
        if (q.selectedHotels.isNotEmpty) {
          for (final h in _hotels) {
            h.dispose();
          }
          _hotels
            ..clear()
            ..addAll(q.selectedHotels.map((h) => _HotelEditor(
                  name: '${h['name'] ?? h['hotelName'] ?? ''}',
                  nights: '${h['nights'] ?? 1}',
                  roomType: '${h['roomType'] ?? ''}',
                )));
        }
        if (q.selectedCabs.isNotEmpty) {
          for (final c in _cabs) {
            c.dispose();
          }
          _cabs
            ..clear()
            ..addAll(q.selectedCabs.map((c) => _CabEditor(
                  vehicle: '${c['vehicleName'] ?? _vehicles.first}',
                  cost: '${c['cost'] ?? 0}',
                  count: '${c['vehicleCount'] ?? 1}',
                )));
        }
        _loadingExisting = false;
      });
      // If user had newer unsaved local edits for this quote, restore them.
      await _restoreLocalIfNewerThanServer();
    } catch (e) {
      if (!mounted) return;
      setState(() => _loadingExisting = false);
      embSnack(context, apiErrorMessage(e), error: true);
      await _tryRestoreLocalDraft();
    }
  }

  Future<void> _restoreLocalIfNewerThanServer() async {
    final draft = await QuoteDraftStore.load(
      quoteId: _quoteId.isEmpty ? null : _quoteId,
      leadId: _leadId.isEmpty ? null : _leadId,
    );
    if (draft == null || !mounted) return;
    final localAt = DateTime.tryParse(draft['savedAt']?.toString() ?? '');
    if (localAt == null) return;
    // Restore local only if it belongs to this quote/lead and has content.
    final draftQuoteId = draft['quoteId']?.toString() ?? '';
    if (draftQuoteId.isNotEmpty && _quoteId.isNotEmpty && draftQuoteId != _quoteId) return;
    final hasEdits = (draft['amount']?.toString().trim().isNotEmpty == true) ||
        (draft['days'] is List && (draft['days'] as List).length > 1);
    if (!hasEdits) return;
    // Always prefer local if saved in last 7 days (app was killed mid-edit).
    if (DateTime.now().difference(localAt).inDays > 7) return;
    setState(() => _applyLocalDraft(draft));
    if (mounted) embSnack(context, 'Unsaved edits restored');
  }

  void _syncDuration(String v) {
    final n = (int.tryParse(v) ?? 1).clamp(1, 21);
    setState(() {
      while (_days.length < n) {
        _days.add(_DayEditor(title: 'Day ${_days.length + 1}'));
      }
      while (_days.length > n) {
        _days.removeLast().dispose();
      }
    });
  }

  Future<void> _pickLead() async {
    final lead = await showModalBottomSheet<Lead>(
      context: context,
      isScrollControlled: true,
      backgroundColor: EmbTheme.paper,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => _LeadPickerSheet(role: _role),
    );
    if (lead != null) _applyLead(lead);
  }

  void _goNext() {
    if (_step == 1 && _leadId.isEmpty) {
      embSnack(context, 'Select a lead first', error: true);
      return;
    }
    if (_step == 5 && (num.tryParse(_amount.text.trim()) ?? 0) <= 0) {
      embSnack(context, 'Enter package total', error: true);
      return;
    }
    final v = _visible;
    final idx = v.indexWhere((s) => s.id == _step);
    final next = v[(idx + 1).clamp(0, v.length - 1)].id;
    if (next == 2) _ensureAiPromptHint();
    setState(() => _step = next);
    _scheduleLocalDraftSave();
  }

  void _goPrev() {
    final v = _visible;
    final idx = v.indexWhere((s) => s.id == _step);
    final prev = v[(idx - 1).clamp(0, v.length - 1)].id;
    if (prev == 2) _ensureAiPromptHint();
    setState(() => _step = prev);
    _scheduleLocalDraftSave();
  }

  QuotationSavePayload _payload(bool asDraft) {
    final pkg = _packageName.text.trim().isNotEmpty
        ? _packageName.text.trim()
        : (_destination.text.trim().isNotEmpty ? _destination.text.trim() : 'Custom Package');
    return QuotationSavePayload(
      leadId: _leadId,
      quoteId: _quoteId.isEmpty ? null : _quoteId,
      asDraft: asDraft,
      packageName: pkg,
      destination: _destination.text.trim().isNotEmpty ? _destination.text.trim() : pkg,
      duration: int.tryParse(_duration.text) ?? _days.length,
      adults: int.tryParse(_adults.text) ?? 2,
      children: int.tryParse(_children.text) ?? 0,
      mealPlan: _mealPlan,
      hotelCategory: _noHotel ? 'No Hotel' : _hotelCategory,
      travelDate: DateFormat('yyyy-MM-dd').format(_travelDate),
      amount: num.tryParse(_amount.text.trim()) ?? 0,
      notes: _notes.text.trim().isEmpty ? null : _notes.text.trim(),
      itinerary: [
        for (var i = 0; i < _days.length; i++)
          QuoteDay(
            day: i + 1,
            title: _days[i].title.text.trim(),
            description: _noHotel
                ? stripMealMentionsFromItinerary(_days[i].description.text)
                : _days[i].description.text.trim(),
          ),
      ],
      hotels: _noHotel
          ? []
          : [
              for (final h in _hotels)
                QuoteHotel(
                  name: h.name.text.trim(),
                  nights: int.tryParse(h.nights.text) ?? 1,
                  roomType: h.roomType.text.trim(),
                  mealPlan: _mealPlan,
                ),
            ],
      cabs: [
        for (final c in _cabs)
          QuoteCab(
            vehicleName: c.vehicle,
            vehicleType: c.vehicle,
            cost: num.tryParse(c.cost.text.trim()) ?? 0,
            vehicleCount: int.tryParse(c.count.text) ?? 1,
          ),
      ],
    );
  }

  QuotationPdfData _pdfData({String? quoteNumber}) {
    final auth = context.read<AuthProvider>().user;
    return QuotationPdfData.fromPayload(
      payload: _payload(true),
      leadName: _leadName,
      leadPhone: _leadPhone,
      quoteNumber: quoteNumber ?? _savedNumber ?? '',
      executiveName: auth?.name.isNotEmpty == true ? auth!.name : 'Explore My Bharat',
    );
  }

  Future<QuotationDetail?> _persist({required bool asDraft, bool popOnSuccess = false}) async {
    if (_leadId.isEmpty) {
      embSnack(context, 'Select a lead first', error: true);
      return null;
    }
    if (!asDraft && (num.tryParse(_amount.text.trim()) ?? 0) <= 0) {
      embSnack(context, 'Enter package total', error: true);
      return null;
    }
    setState(() => _saving = true);
    try {
      final svc = context.read<QuotationsService>();
      var saved = await svc.saveQuotationBuilder(_role, _payload(asDraft));
      // Executive submit needs PUT action for auto-approve / TL notifications.
      if (!asDraft && _role == 'sales_executive' && saved.id.isNotEmpty) {
        try {
          saved = await svc.quotationAction(_role, saved.id, action: 'submit');
        } catch (_) {
          // Autosave status already pending_approval — ignore action failure.
        }
      }
      if (!mounted) return saved;
      setState(() {
        _saving = false;
        _didSave = true;
        if (saved.id.isNotEmpty) _quoteId = saved.id;
        _savedNumber = saved.quoteNumber.isEmpty ? null : saved.quoteNumber;
        if (saved.leadPhone.isNotEmpty) _leadPhone = saved.leadPhone;
      });
      if (asDraft) {
        unawaited(_persistLocalDraft());
      } else {
        unawaited(_clearLocalDraft());
      }
      embSnack(context, asDraft ? 'Draft saved ${_savedNumber ?? ''}' : 'Quotation saved ${_savedNumber ?? ''}');
      if (popOnSuccess && !asDraft) Navigator.of(context).pop(true);
      return saved;
    } catch (e) {
      if (!mounted) return null;
      setState(() => _saving = false);
      embSnack(context, apiErrorMessage(e), error: true);
      return null;
    }
  }

  Future<void> _save(bool asDraft) => _persist(asDraft: asDraft, popOnSuccess: true);

  Future<void> _previewPdf() async {
    if (_leadId.isEmpty) {
      embSnack(context, 'Select a lead first', error: true);
      return;
    }
    final data = _pdfData();
    if (!mounted) return;
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => QuotationPdfPreviewScreen(
          title: 'Quotation PDF',
          htmlFuture: buildQuotationPreviewHtml(data),
        ),
      ),
    );
  }

  Future<void> _sendWhatsApp() async {
    if (_leadId.isEmpty) {
      embSnack(context, 'Select a lead first', error: true);
      return;
    }
    if ((num.tryParse(_amount.text.trim()) ?? 0) <= 0) {
      embSnack(context, 'Enter package total', error: true);
      return;
    }
    if (_leadPhone.trim().isEmpty && _leadId.isNotEmpty) {
      try {
        final lead = await context.read<LeadsService>().fetchLeadDetail(_role, _leadId);
        if ((lead.phone ?? '').trim().isNotEmpty) _leadPhone = lead.phone!.trim();
      } catch (_) {}
    }
    if (_leadPhone.trim().isEmpty) {
      embSnack(context, 'Customer phone missing on lead', error: true);
      return;
    }

    final svc = context.read<QuotationsService>();
    final execName = context.read<AuthProvider>().user?.name;
    final role = _role;
    setState(() => _sharing = true);
    try {
      // Save without popping / noisy snack — keep user on Preview until WA opens.
      QuotationDetail? saved;
      setState(() => _saving = true);
      try {
        saved = await svc.saveQuotationBuilder(role, _payload(false));
        if (role == 'sales_executive' && saved.id.isNotEmpty) {
          try {
            saved = await svc.quotationAction(role, saved.id, action: 'submit');
          } catch (_) {}
        }
        if (mounted) {
          setState(() {
            _saving = false;
            _didSave = true;
            if (saved!.id.isNotEmpty) _quoteId = saved.id;
            _savedNumber = saved.quoteNumber.isEmpty ? null : saved.quoteNumber;
            if (saved.leadPhone.isNotEmpty) _leadPhone = saved.leadPhone;
          });
        }
      } catch (e) {
        if (mounted) {
          setState(() {
            _saving = false;
            _sharing = false;
          });
          embSnack(context, apiErrorMessage(e), error: true);
        }
        return;
      }

      if (saved == null || saved.id.isEmpty) {
        if (mounted) setState(() => _sharing = false);
        embSnack(context, 'Quotation save failed', error: true);
        return;
      }

      final pdfData = _pdfData(quoteNumber: saved.quoteNumber);
      final message = buildQuotationWhatsAppMessage(
        leadName: _leadName,
        packageName: pdfData.packageName,
        destination: pdfData.destination,
        duration: pdfData.duration,
        total: pdfData.amount,
        quoteNumber: saved.quoteNumber,
        executiveName: (execName != null && execName.isNotEmpty) ? execName : 'Explore My Bharat',
      );
      final fileName =
          'Quotation-${saved.quoteNumber.isEmpty ? 'No' : saved.quoteNumber}.pdf'.replaceAll(RegExp(r'[^\w.-]+'), '_');

      String? pdfB64;
      try {
        final bytes = await buildQuotationPdfBytes(pdfData);
        pdfB64 = quotationPdfBase64(bytes);
        try {
          await svc.uploadQuotationPdf(role, saved.id, bytes);
        } catch (_) {}
      } catch (_) {
        // PDF fail — still open WhatsApp with text message.
        pdfB64 = null;
      }

      if (role == 'sales_executive' && saved.status == 'approved') {
        try {
          await svc.quotationAction(role, saved.id, action: 'send');
        } catch (_) {}
      }

      if (!mounted) return;
      final ok = await openWhatsAppWithPdf(
        pdfBase64: pdfB64,
        fileName: fileName,
        message: message,
        phone: _leadPhone,
      );
      if (!mounted) return;
      setState(() {
        _sharing = false;
        _didSave = true;
      });
      embSnack(
        context,
        ok
            ? (pdfB64 != null
                ? 'WhatsApp choose karein — PDF attach karke Send'
                : 'WhatsApp open — PDF nahi bani, message bhej dein')
            : 'WhatsApp open nahi hua. WhatsApp install check karein',
        error: !ok,
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _sharing = false);
      embSnack(context, apiErrorMessage(e), error: true);
    }
  }

  String get _submitLabel => _role == 'sales_executive' ? 'Submit for approval' : 'Save quotation';

  @override
  Widget build(BuildContext context) {
    if (_loadingExisting) {
      return Scaffold(backgroundColor: EmbTheme.cream, appBar: embAppBar('Quotation'), body: const EmbLoading());
    }
    final visible = _visible;
    final idx = visible.indexWhere((s) => s.id == _step);
    final current = _steps.firstWhere((s) => s.id == _step);
    final isFirst = idx <= 0;
    final isLast = _step == 6;

    return PopScope<bool>(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) Navigator.of(context).pop(_didSave);
      },
      child: Scaffold(
        backgroundColor: EmbTheme.cream,
        appBar: embAppBar(_quoteId.isNotEmpty ? 'Edit Quotation' : 'New Quotation'),
        body: Column(
          children: [
            LinearProgressIndicator(
              value: (idx + 1) / visible.length,
              minHeight: 3,
              color: EmbTheme.teal,
              backgroundColor: EmbTheme.border,
            ),
            SizedBox(
              height: 64,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                children: [
                  for (var i = 0; i < visible.length; i++)
                    GestureDetector(
                      onTap: () {
                        final id = visible[i].id;
                        if (id == 2) _ensureAiPromptHint();
                        setState(() => _step = id);
                        _scheduleLocalDraftSave();
                      },
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        child: Column(
                          children: [
                            CircleAvatar(
                              radius: 13,
                              backgroundColor: visible[i].id == _step
                                  ? EmbTheme.teal
                                  : (i < idx ? EmbTheme.mint : EmbTheme.border),
                              child: i < idx
                                  ? const Icon(Icons.check, size: 14, color: Colors.white)
                                  : Text('${i + 1}',
                                      style: embBody(
                                        size: 12,
                                        weight: FontWeight.w800,
                                        color: visible[i].id == _step ? Colors.white : EmbTheme.inkSoft,
                                      )),
                            ),
                            const SizedBox(height: 3),
                            Text(visible[i].title,
                                style: embBody(
                                  size: 11,
                                  weight: visible[i].id == _step ? FontWeight.w800 : FontWeight.w500,
                                  color: visible[i].id == _step ? EmbTheme.teal : EmbTheme.muted,
                                )),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
                children: [
                  Row(
                    children: [
                      Icon(current.icon, color: EmbTheme.teal),
                      const SizedBox(width: 8),
                      Text(current.title, style: embBody(size: 18, weight: FontWeight.w800)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ..._stepBody(),
                ],
              ),
            ),
            SafeArea(
              top: false,
              child: Container(
                padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
                decoration: const BoxDecoration(
                  color: EmbTheme.white,
                  border: Border(top: BorderSide(color: EmbTheme.border)),
                ),
                child: isLast
                    ? Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          EmbPrimaryButton(
                            label: _sharing ? 'Sending…' : 'Send on WhatsApp',
                            icon: Icons.chat,
                            busy: _sharing || _saving,
                            onPressed: (_sharing || _saving) ? null : _sendWhatsApp,
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Expanded(
                                child: OutlinedButton.icon(
                                  onPressed: (_sharing || _saving) ? null : _previewPdf,
                                  icon: const Icon(Icons.picture_as_pdf_outlined, size: 18),
                                  label: const Text('Preview PDF'),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: OutlinedButton(
                                  onPressed: (_sharing || _saving) ? null : () => _save(false),
                                  child: Text(_submitLabel, textAlign: TextAlign.center),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Expanded(
                                child: OutlinedButton(onPressed: _goPrev, child: const Text('Back')),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: OutlinedButton(
                                  onPressed: (_sharing || _saving) ? null : () => _save(true),
                                  child: const Text('Save draft'),
                                ),
                              ),
                            ],
                          ),
                        ],
                      )
                    : Row(
                        children: [
                          if (!isFirst) ...[
                            Expanded(child: OutlinedButton(onPressed: _goPrev, child: const Text('Back'))),
                            const SizedBox(width: 10),
                          ],
                          Expanded(
                            flex: 2,
                            child: EmbPrimaryButton(label: 'Next', icon: Icons.arrow_forward, onPressed: _goNext),
                          ),
                        ],
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<Widget> _stepBody() {
    switch (_step) {
      case 1:
        return _stepPackage();
      case 2:
        return _stepItinerary();
      case 3:
        return _stepHotels();
      case 4:
        return _stepTransport();
      case 5:
        return _stepPricing();
      default:
        return _stepPreview();
    }
  }

  Widget _gap([double h = 12]) => SizedBox(height: h);

  List<Widget> _stepPackage() => [
        EmbCard(
          onTap: _pickLead,
          child: Row(
            children: [
              const Icon(Icons.person_search, color: EmbTheme.teal),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  _leadName.isNotEmpty ? _leadName : (_leadId.isNotEmpty ? 'Lead selected' : 'Select lead *'),
                  style: embBody(size: 15, weight: FontWeight.w700),
                ),
              ),
              const Icon(Icons.chevron_right, color: EmbTheme.muted),
            ],
          ),
        ),
        TextField(controller: _packageName, decoration: embInput('Package name', icon: Icons.card_travel)),
        _gap(),
        TextField(controller: _destination, decoration: embInput('Destination', icon: Icons.place_outlined)),
        _gap(),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _duration,
                keyboardType: TextInputType.number,
                decoration: embInput('Days'),
                onChanged: _syncDuration,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: TextField(
                controller: _adults,
                keyboardType: TextInputType.number,
                decoration: embInput('Adults'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: TextField(
                controller: _children,
                keyboardType: TextInputType.number,
                decoration: embInput('Children'),
              ),
            ),
          ],
        ),
        _gap(),
        DropdownButtonFormField<String>(
          initialValue: _mealPlan,
          decoration: embInput('Meal plan', icon: Icons.restaurant_outlined),
          items: _mealPlans.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
          onChanged: (v) {
            setState(() {
              _mealPlan = v ?? _mealPlan;
              if (_noHotel) {
                _stripMealsFromDaysIfCabOnly();
                // Refresh AI hint if still default-ish.
                if (_aiPrompt.text.toLowerCase().contains('meals and transfers')) {
                  _aiPrompt.clear();
                  _ensureAiPromptHint();
                }
              }
            });
          },
        ),
        if (!_noHotel) ...[
          _gap(),
          DropdownButtonFormField<String>(
            initialValue: _hotelCategory,
            decoration: embInput('Hotel category', icon: Icons.star_outline),
            items: _hotelCategories.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
            onChanged: (v) => setState(() => _hotelCategory = v ?? _hotelCategory),
          ),
        ],
        _gap(),
        InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: () async {
            final d = await showDatePicker(
              context: context,
              initialDate: _travelDate,
              firstDate: DateTime.now().subtract(const Duration(days: 1)),
              lastDate: DateTime.now().add(const Duration(days: 730)),
            );
            if (d != null) setState(() => _travelDate = d);
          },
          child: InputDecorator(
            decoration: embInput('Travel date', icon: Icons.event_outlined),
            child: Text(DateFormat('dd MMM yyyy').format(_travelDate), style: embBody()),
          ),
        ),
      ];

  void _ensureAiPromptHint() {
    if (_aiPrompt.text.trim().isNotEmpty) return;
    final dest = _destination.text.trim().isEmpty ? 'Himachal' : _destination.text.trim();
    final days = int.tryParse(_duration.text) ?? _days.length;
    final nights = days > 0 ? days - 1 : 0;
    _aiPrompt.text = _noHotel
        ? '$nights Nights $days Days $dest cab-only package. Include sightseeing and transfers. Do NOT include breakfast, dinner or any hotel meals.'
        : '$nights Nights $days Days $dest package. Include sightseeing, meals and transfers.';
  }

  void _stripMealsFromDaysIfCabOnly() {
    if (!_noHotel) return;
    for (final d in _days) {
      final cleaned = stripMealMentionsFromItinerary(d.description.text);
      if (cleaned != d.description.text.trim()) {
        d.description.text = cleaned;
      }
    }
  }

  Future<void> _generateAiItinerary({bool regenerate = false}) async {
    final prompt = _aiPrompt.text.trim();
    if (prompt.isEmpty) {
      setState(() => _aiError = 'Describe the package — e.g. "3N 4D Himachal honeymoon from Delhi"');
      return;
    }
    final days = int.tryParse(_duration.text);
    final nights = days != null && days > 0 ? days - 1 : null;
    setState(() {
      _aiGenerating = true;
      _aiError = null;
      _aiWarning = null;
      if (regenerate) {
        _aiSeed += 1;
      } else {
        _aiSeed = 0;
      }
    });
    try {
      final result = await context.read<AiItineraryService>().generate(
            prompt: prompt,
            destination: _destination.text.trim(),
            days: days,
            nights: nights,
            variationSeed: _aiSeed,
            includeMeals: !_noHotel,
          );
      if (!mounted) return;
      for (final d in _days) {
        d.dispose();
      }
      _days
        ..clear()
        ..addAll(
          result.days.map((d) {
            var desc = d.description.trim();
            if (_noHotel) desc = stripMealMentionsFromItinerary(desc);
            final parts = <String>[
              if (desc.isNotEmpty) desc,
              // Breakfast / dinner only when hotels are part of the package.
              if (!_noHotel && (d.meals ?? '').trim().isNotEmpty) 'Meals: ${d.meals}',
              if ((d.transport ?? '').trim().isNotEmpty) 'Transport: ${d.transport}',
            ];
            return _DayEditor(title: d.title, description: parts.join('\n'));
          }),
        );
      _duration.text = '${result.totalDays}';
      setState(() {
        _aiGenerating = false;
        _aiPickup = result.pickup;
        _aiDrop = result.drop;
        _aiWarning = result.warning;
      });
      embSnack(context, 'AI itinerary ready (${result.totalDays} days)');
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _aiGenerating = false;
        _aiError = e.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  List<Widget> _stepItinerary() => [
      EmbCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: EmbTheme.saffronSoft,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.auto_awesome, color: EmbTheme.saffron, size: 20),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('AI Itinerary Generator', style: embBody(size: 16, weight: FontWeight.w800)),
                      Text(
                        'Same as website — describe the trip and generate day-wise plan',
                        style: embBody(size: 12, color: EmbTheme.inkSoft),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _aiPrompt,
              minLines: 3,
              maxLines: 6,
              decoration: embInput(
                'Trip brief',
                hint: 'e.g. Pickup Delhi, 3N 4D Manali honeymoon with Solang & Atal Tunnel',
                icon: Icons.edit_note_outlined,
              ),
            ),
            if (_aiError != null) ...[
              const SizedBox(height: 8),
              Text(_aiError!, style: embBody(size: 12.5, color: EmbTheme.danger)),
            ],
            if (_aiWarning != null) ...[
              const SizedBox(height: 8),
              Text(_aiWarning!, style: embBody(size: 12.5, color: EmbTheme.saffron)),
            ],
            if ((_aiPickup ?? '').isNotEmpty || (_aiDrop ?? '').isNotEmpty) ...[
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 6,
                children: [
                  if ((_aiPickup ?? '').isNotEmpty)
                    EmbPill('Pickup: $_aiPickup', color: EmbTheme.sky),
                  if ((_aiDrop ?? '').isNotEmpty)
                    EmbPill('Drop: $_aiDrop', color: EmbTheme.teal),
                ],
              ),
            ],
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: EmbPrimaryButton(
                    label: _aiGenerating ? 'Generating…' : 'Generate Itinerary',
                    icon: Icons.auto_awesome,
                    busy: _aiGenerating,
                    onPressed: _aiGenerating ? null : () => _generateAiItinerary(),
                  ),
                ),
                const SizedBox(width: 8),
                OutlinedButton.icon(
                  onPressed: _aiGenerating ? null : () => _generateAiItinerary(regenerate: true),
                  icon: const Icon(Icons.refresh, size: 18),
                  label: const Text('Regen'),
                ),
              ],
            ),
          ],
        ),
      ),
      const EmbSectionTitle('Day-wise plan (edit anytime)'),
      for (var i = 0; i < _days.length; i++)
        EmbCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text('Day ${i + 1}',
                        style: embBody(size: 13, weight: FontWeight.w800, color: EmbTheme.teal)),
                  ),
                  if (_days.length > 1)
                    IconButton(
                      tooltip: 'Remove day',
                      onPressed: () => setState(() {
                        _days.removeAt(i).dispose();
                        _duration.text = '${_days.length}';
                      }),
                      icon: const Icon(Icons.delete_outline, size: 18, color: EmbTheme.muted),
                    ),
                ],
              ),
              const SizedBox(height: 4),
              TextField(controller: _days[i].title, decoration: embInput('Title')),
              const SizedBox(height: 8),
              TextField(
                controller: _days[i].description,
                minLines: 2,
                maxLines: 6,
                decoration: embInput('Activities / description'),
              ),
            ],
          ),
        ),
      OutlinedButton.icon(
        onPressed: _days.length >= 21
            ? null
            : () => setState(() {
                  _days.add(_DayEditor(title: 'Day ${_days.length + 1}'));
                  _duration.text = '${_days.length}';
                }),
        icon: const Icon(Icons.add),
        label: const Text('Add day manually'),
      ),
    ];

  List<Widget> _stepHotels() => [
        for (var i = 0; i < _hotels.length; i++)
          EmbCard(
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text('Hotel ${i + 1}',
                          style: embBody(size: 13, weight: FontWeight.w800, color: EmbTheme.teal)),
                    ),
                    if (_hotels.length > 1)
                      IconButton(
                        visualDensity: VisualDensity.compact,
                        icon: const Icon(Icons.delete_outline, color: EmbTheme.danger),
                        onPressed: () => setState(() => _hotels.removeAt(i).dispose()),
                      ),
                  ],
                ),
                TextField(controller: _hotels[i].name, decoration: embInput('Hotel name', icon: Icons.hotel)),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _hotels[i].nights,
                        keyboardType: TextInputType.number,
                        decoration: embInput('Nights'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      flex: 2,
                      child: TextField(controller: _hotels[i].roomType, decoration: embInput('Room type')),
                    ),
                  ],
                ),
              ],
            ),
          ),
        OutlinedButton.icon(
          onPressed: () => setState(() => _hotels.add(_HotelEditor())),
          icon: const Icon(Icons.add),
          label: const Text('Add hotel'),
        ),
      ];

  List<Widget> _stepTransport() => [
        for (var i = 0; i < _cabs.length; i++)
          EmbCard(
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text('Vehicle ${i + 1}',
                          style: embBody(size: 13, weight: FontWeight.w800, color: EmbTheme.teal)),
                    ),
                    if (_cabs.length > 1)
                      IconButton(
                        visualDensity: VisualDensity.compact,
                        icon: const Icon(Icons.delete_outline, color: EmbTheme.danger),
                        onPressed: () => setState(() => _cabs.removeAt(i).dispose()),
                      ),
                  ],
                ),
                DropdownButtonFormField<String>(
                  initialValue: _vehicles.contains(_cabs[i].vehicle) ? _cabs[i].vehicle : null,
                  isExpanded: true,
                  decoration: embInput('Vehicle', icon: Icons.directions_car_outlined),
                  items: _vehicles.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                  onChanged: (v) => setState(() => _cabs[i].vehicle = v ?? _cabs[i].vehicle),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _cabs[i].cost,
                        keyboardType: TextInputType.number,
                        decoration: embInput('Cost (₹)'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        controller: _cabs[i].count,
                        keyboardType: TextInputType.number,
                        decoration: embInput('Count'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        OutlinedButton.icon(
          onPressed: () => setState(() => _cabs.add(_CabEditor())),
          icon: const Icon(Icons.add),
          label: const Text('Add vehicle'),
        ),
      ];

  List<Widget> _stepPricing() {
    final amount = num.tryParse(_amount.text.trim()) ?? 0;
    return [
      TextField(
        controller: _amount,
        keyboardType: TextInputType.number,
        decoration: embInput('Package total (₹) *', icon: Icons.currency_rupee),
        onChanged: (_) => setState(() {}),
      ),
      _gap(),
      EmbCard(
        child: Column(
          children: [
            _kv('Advance (30%)', formatMoney((amount * 0.3).round())),
            _kv('Before tour (50%)', formatMoney((amount * 0.5).round())),
            _kv('On arrival (20%)', formatMoney((amount * 0.2).round())),
          ],
        ),
      ),
      TextField(
        controller: _notes,
        minLines: 3,
        maxLines: 6,
        decoration: embInput('Notes / travel guidelines'),
      ),
    ];
  }

  List<Widget> _stepPreview() {
    final amount = num.tryParse(_amount.text.trim()) ?? 0;
    final hotels = _noHotel ? <_HotelEditor>[] : _hotels.where((h) => h.name.text.trim().isNotEmpty).toList();
    final cabs = _cabs;
    return [
      EmbCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _packageName.text.trim().isEmpty ? (_destination.text.trim().isEmpty ? 'Custom Package' : _destination.text.trim()) : _packageName.text.trim(),
              style: embBody(size: 20, weight: FontWeight.w800),
            ),
            const SizedBox(height: 4),
            Text(formatMoney(amount), style: embBody(size: 24, weight: FontWeight.w800, color: EmbTheme.teal)),
            const SizedBox(height: 8),
            _kv('Lead', _leadName.isEmpty ? '—' : _leadName),
            _kv('Destination', _destination.text.trim().isEmpty ? '—' : _destination.text.trim()),
            _kv('Duration', '${_days.length} days'),
            _kv('Travellers', '${_adults.text} adults, ${_children.text} children'),
            if (!_noHotel) _kv('Meal plan', _mealPlan),
            if (_noHotel) _kv('Package type', 'Cab only (no hotel / meals)'),
            _kv('Travel date', DateFormat('dd MMM yyyy').format(_travelDate)),
          ],
        ),
      ),
      const EmbSectionTitle('Itinerary'),
      if (_days.isEmpty)
        const EmptyState(message: 'No itinerary')
      else
        for (var i = 0; i < _days.length; i++)
          EmbCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Day ${i + 1}: ${_days[i].title.text}', style: embBody(weight: FontWeight.w700)),
                if (_days[i].description.text.trim().isNotEmpty)
                  Text(_days[i].description.text, style: embBody(size: 13, color: EmbTheme.inkSoft)),
              ],
            ),
          ),
      if (hotels.isNotEmpty) ...[
        const EmbSectionTitle('Hotels'),
        for (final h in hotels)
          EmbCard(child: Text('${h.name.text} • ${h.nights.text}N • ${h.roomType.text}', style: embBody())),
      ],
      const EmbSectionTitle('Transport'),
      for (final c in cabs)
        EmbCard(
          child: Row(
            children: [
              Expanded(child: Text('${c.vehicle} × ${c.count.text}', style: embBody())),
              Text(formatMoney(num.tryParse(c.cost.text.trim()) ?? 0), style: embBody(weight: FontWeight.w700)),
            ],
          ),
        ),
      EmbCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Preview & send', style: embBody(size: 15, weight: FontWeight.w800)),
            const SizedBox(height: 4),
            Text(
              'Preview PDF opens the quotation document. Send on WhatsApp attaches the PDF like the website.',
              style: embBody(size: 12.5, color: EmbTheme.inkSoft),
            ),
            if (_leadPhone.isNotEmpty) ...[
              const SizedBox(height: 8),
              EmbPill('WA: $_leadPhone', color: EmbTheme.mint),
            ],
          ],
        ),
      ),
      if (_savedNumber != null)
        Padding(
          padding: const EdgeInsets.only(top: 6),
          child: Text('Saved as $_savedNumber', style: embBody(color: EmbTheme.mint, weight: FontWeight.w700)),
        ),
    ];
  }

  Widget _kv(String k, String v) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 3),
        child: Row(
          children: [
            Expanded(child: Text(k, style: embBody(size: 13, color: EmbTheme.muted))),
            Text(v, style: embBody(size: 14, weight: FontWeight.w600)),
          ],
        ),
      );
}

/// Bottom sheet that searches the leads list.
class _LeadPickerSheet extends StatefulWidget {
  const _LeadPickerSheet({required this.role});
  final String role;

  @override
  State<_LeadPickerSheet> createState() => _LeadPickerSheetState();
}

class _LeadPickerSheetState extends State<_LeadPickerSheet> {
  final _ctrl = TextEditingController();
  Timer? _debounce;
  List<Lead> _leads = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _search('');
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _search(String q) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final r = await context.read<LeadsService>().fetchLeads(widget.role, search: q, limit: 30);
      if (!mounted) return;
      setState(() {
        _leads = r.items;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = apiErrorMessage(e);
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.viewInsetsOf(context).bottom;
    return Padding(
      padding: EdgeInsets.only(bottom: bottom),
      child: SizedBox(
        height: MediaQuery.sizeOf(context).height * 0.75,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: TextField(
                controller: _ctrl,
                autofocus: true,
                decoration: embInput('Search leads by name / phone', icon: Icons.search),
                onChanged: (v) {
                  _debounce?.cancel();
                  _debounce = Timer(const Duration(milliseconds: 350), () => _search(v.trim()));
                },
              ),
            ),
            Expanded(
              child: _loading
                  ? const EmbLoading()
                  : _error != null
                      ? EmbErrorView(message: _error!, onRetry: () => _search(_ctrl.text.trim()))
                      : _leads.isEmpty
                          ? const EmptyState(message: 'No leads found')
                          : ListView.builder(
                              itemCount: _leads.length,
                              itemBuilder: (_, i) {
                                final l = _leads[i];
                                return ListTile(
                                  leading: const CircleAvatar(
                                    backgroundColor: EmbTheme.tealSoft,
                                    child: Icon(Icons.person, color: EmbTheme.teal),
                                  ),
                                  title: Text(l.name, style: embBody(weight: FontWeight.w700)),
                                  subtitle: Text(
                                    [l.destination, l.phone].where((e) => e != null && e.isNotEmpty).join(' • '),
                                  ),
                                  onTap: () => Navigator.of(context).pop(l),
                                );
                              },
                            ),
            ),
          ],
        ),
      ),
    );
  }
}
