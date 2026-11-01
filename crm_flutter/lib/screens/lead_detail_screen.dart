import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../core/api_client.dart';
import '../core/emb_theme.dart';
import '../models/models.dart';
import '../providers/auth_provider.dart';
import '../services/leads_service.dart';
import '../services/quotation_pdf_builder.dart';
import '../services/quotations_service.dart';
import '../services/service_utils.dart';
import '../services/whatsapp_pdf_share.dart';
import '../widgets/emb_widgets.dart';
import 'followup_form_screen.dart';
import 'lead_detail/lead_detail_sections.dart';
import 'lead_detail/lead_detail_sheets.dart';
import 'lead_detail/lead_detail_utils.dart';
import 'lead_form_screen.dart';
import 'quotation_pdf_preview_screen.dart';
import 'quote_builder_screen.dart';
import 'quote_detail_screen.dart';

/// Per-section async state so one failing endpoint never blanks the whole page.
class _Sec<T> {
  _Sec(this.data);
  T data;
  bool loading = true;
  String? error;
}

/// Native "Lead 360" screen — mirrors the CRM website lead detail page.
class LeadDetailScreen extends StatefulWidget {
  const LeadDetailScreen({super.key, required this.leadId});
  final String leadId;

  @override
  State<LeadDetailScreen> createState() => _LeadDetailScreenState();
}

class _LeadDetailScreenState extends State<LeadDetailScreen> {
  bool _loading = true;
  String? _error;
  Lead? _lead;

  final _timeline = _Sec<List<Map<String, dynamic>>>([]);
  final _notes = _Sec<List<Map<String, dynamic>>>([]);
  final _quotes = _Sec<List<Quotation>>([]);
  final _followups = _Sec<List<FollowUp>>([]);
  final _emails = _Sec<List<Map<String, dynamic>>>([]);
  final _transfers = _Sec<List<Map<String, dynamic>>>([]);
  final _audit = _Sec<List<Map<String, dynamic>>>([]);
  Map<String, dynamic>? _booking;
  Map<String, dynamic>? _advance;
  bool _bookingLoading = false;
  String? _sharingQuoteId;

  String get _role => context.read<AuthProvider>().user?.role ?? 'sales_executive';
  LeadsService get _svc => context.read<LeadsService>();

  bool get _canAssign => const {'admin', 'sales_manager', 'team_leader'}.contains(_role);
  bool get _canAudit => const {'admin', 'sales_manager'}.contains(_role);
  bool get _canReactivate => const {'admin', 'sales_manager', 'team_leader'}.contains(_role);
  bool get _canConvertRole =>
      const {'admin', 'sales_manager', 'team_leader', 'sales_executive'}.contains(_role);

  @override
  void initState() {
    super.initState();
    _load();
  }

  // -------------------------------------------------------------------------
  // Loading
  // -------------------------------------------------------------------------

  Future<void> _load({bool refresh = false}) async {
    if (!refresh) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }
    try {
      Lead detail;
      try {
        detail = await _svc.fetchLeadDetail(_role, widget.leadId, includeRelated: true);
      } catch (_) {
        detail = await _svc.fetchLeadDetail(_role, widget.leadId);
      }
      if (!mounted) return;
      setState(() {
        _lead = detail;
        _loading = false;
        _error = null;
      });
      _seedEmbedded(detail);
      await _loadRelated();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        if (_lead == null) _error = apiErrorMessage(e);
        _loading = false;
      });
      if (_lead != null && refresh) embSnack(context, apiErrorMessage(e), error: true);
    }
  }

  /// Use followups / quotations embedded by `includeRelated=true` as an instant first paint.
  void _seedEmbedded(Lead lead) {
    final raw = lead.raw ?? const <String, dynamic>{};
    final fu = asMapList(raw['followups'] ?? raw['followUps']);
    final qs = asMapList(raw['quotations']);
    setState(() {
      if (fu.isNotEmpty) _followups.data = fu.map(FollowUp.fromJson).toList();
      if (qs.isNotEmpty) _quotes.data = qs.map(Quotation.fromJson).toList();
    });
  }

  Future<void> _loadRelated() => Future.wait([
        _loadTimeline(),
        _loadNotes(),
        _loadQuotes(),
        _loadFollowups(),
        _loadEmails(),
        _loadTransfers(),
        if (_canAudit) _loadAudit(),
        _loadBooking(),
      ]);

  Future<void> _run<T>(_Sec<T> sec, Future<T> Function() fetch) async {
    if (mounted) {
      setState(() {
        sec.loading = true;
        sec.error = null;
      });
    }
    try {
      final data = await fetch();
      if (!mounted) return;
      setState(() {
        sec.data = data;
        sec.loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        sec.loading = false;
        sec.error = apiErrorMessage(e);
      });
    }
  }

  Future<void> _loadTimeline() => _run(_timeline, () => _svc.fetchTimeline(_role, widget.leadId));
  Future<void> _loadNotes() => _run(_notes, () => _svc.fetchNotes(_role, widget.leadId));
  Future<void> _loadQuotes() => _run(_quotes, () => _svc.fetchLeadQuotations(_role, widget.leadId));
  Future<void> _loadFollowups() => _run(_followups, () => _svc.fetchFollowupsForLead(_role, widget.leadId));
  Future<void> _loadEmails() => _run(_emails, () => _svc.fetchEmailHistory(_role, widget.leadId));
  Future<void> _loadTransfers() => _run(_transfers, () => _svc.fetchTransferHistory(_role, widget.leadId));
  Future<void> _loadAudit() => _run(_audit, () => _svc.fetchAudit(_role, widget.leadId));

  Future<void> _loadBooking() async {
    if (_lead?.status != 'converted') {
      if (mounted) {
        setState(() {
          _booking = null;
          _advance = null;
        });
      }
      return;
    }
    if (mounted) setState(() => _bookingLoading = true);
    try {
      final res = await _svc.fetchBookingForLead(widget.leadId);
      if (!mounted) return;
      setState(() {
        _booking = res['booking'] is Map ? Map<String, dynamic>.from(res['booking'] as Map) : null;
        _advance = res['advancePayment'] is Map ? Map<String, dynamic>.from(res['advancePayment'] as Map) : null;
        _bookingLoading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _bookingLoading = false);
    }
  }

  Future<void> _refreshAll() => _load(refresh: true);

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  Future<void> _call() async {
    final phone = _lead?.phone;
    if (phone == null || phone.isEmpty) return;
    await launchUrl(Uri.parse('tel:$phone'));
  }

  Future<void> _whatsapp() async {
    final lead = _lead!;
    final phone = lead.whatsapp ?? lead.phone;
    if (phone == null || phone.isEmpty) return;
    // Log the contact attempt (best-effort), then hand off to the WhatsApp app.
    try {
      await _svc.logWhatsappContact(_role, lead.id);
      unawaited(_loadTimeline());
    } catch (_) {}
    final ok = await launchUrl(
      Uri.parse('https://wa.me/${whatsappDigits(phone)}'),
      mode: LaunchMode.externalApplication,
    );
    if (!ok && mounted) embSnack(context, 'Could not open WhatsApp', error: true);
  }

  Future<void> _email() async {
    final ok = await showEmailSheet(context, lead: _lead!, role: _role);
    if (ok == true) {
      unawaited(_loadEmails());
      unawaited(_loadTimeline());
    }
  }

  Future<void> _createQuote() async {
    final lead = _lead!;
    final saved = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => QuoteBuilderScreen(leadId: lead.id, leadName: lead.name)),
    );
    if (saved == true) _refreshAll();
  }

  Future<void> _openQuote(String quoteId) async {
    await Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => QuoteDetailScreen(quoteId: quoteId)),
    );
    if (mounted) {
      unawaited(_loadQuotes());
      unawaited(_loadTimeline());
    }
  }

  Future<void> _previewQuote(Quotation q) async {
    final lead = _lead;
    if (lead == null) return;
    final svc = context.read<QuotationsService>();
    final execName = context.read<AuthProvider>().user?.name;
    embSnack(context, 'PDF preview loading…');
    try {
      final detail = await svc.fetchQuotation(_role, q.id);
      if (!mounted) return;
      final brand = (execName != null && execName.isNotEmpty) ? execName : 'Explore My Bharat';
      final data = QuotationPdfData.fromDetail(detail, executiveName: brand);
      // Prefer lead phone/name from this screen when detail is thin.
      final withLead = QuotationPdfData(
        packageName: data.packageName,
        destination: data.destination,
        duration: data.duration,
        adults: data.adults,
        children: data.children,
        mealPlan: data.mealPlan,
        hotelCategory: data.hotelCategory,
        travelDate: data.travelDate,
        amount: data.amount,
        leadName: data.leadName == 'Lead' ? lead.name : data.leadName,
        leadPhone: data.leadPhone.isNotEmpty ? data.leadPhone : (lead.phone ?? lead.whatsapp ?? ''),
        quoteNumber: data.quoteNumber,
        notes: data.notes,
        executiveName: data.executiveName,
        itinerary: data.itinerary,
        hotels: data.hotels,
        cabs: data.cabs,
      );
      await Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => QuotationPdfPreviewScreen(
            title: q.quoteNumber ?? 'Quotation PDF',
            htmlFuture: buildQuotationPreviewHtml(withLead),
          ),
        ),
      );
    } catch (e) {
      if (mounted) embSnack(context, apiErrorMessage(e), error: true);
    }
  }

  Future<void> _shareQuote(Quotation q) async {
    final lead = _lead;
    if (lead == null) return;
    final phone = (lead.phone ?? lead.whatsapp ?? '').trim();
    if (phone.isEmpty) {
      embSnack(context, 'Customer phone missing on lead', error: true);
      return;
    }
    final svc = context.read<QuotationsService>();
    final execName = context.read<AuthProvider>().user?.name;
    final brand = (execName != null && execName.isNotEmpty) ? execName : 'Explore My Bharat';
    setState(() => _sharingQuoteId = q.id);
    try {
      final detail = await svc.fetchQuotation(_role, q.id);
      final data = QuotationPdfData.fromDetail(detail, executiveName: brand);
      final pdfData = QuotationPdfData(
        packageName: data.packageName,
        destination: data.destination,
        duration: data.duration,
        adults: data.adults,
        children: data.children,
        mealPlan: data.mealPlan,
        hotelCategory: data.hotelCategory,
        travelDate: data.travelDate,
        amount: data.amount,
        leadName: data.leadName == 'Lead' ? lead.name : data.leadName,
        leadPhone: phone,
        quoteNumber: data.quoteNumber.isEmpty ? (q.quoteNumber ?? '') : data.quoteNumber,
        notes: data.notes,
        executiveName: data.executiveName,
        itinerary: data.itinerary,
        hotels: data.hotels,
        cabs: data.cabs,
      );

      String? pdfB64;
      try {
        final bytes = await buildQuotationPdfBytes(pdfData);
        pdfB64 = quotationPdfBase64(bytes);
        try {
          await svc.uploadQuotationPdf(_role, q.id, bytes);
        } catch (_) {}
      } catch (_) {
        pdfB64 = null;
      }

      final message = buildQuotationWhatsAppMessage(
        leadName: pdfData.leadName,
        packageName: pdfData.packageName,
        destination: pdfData.destination,
        duration: pdfData.duration,
        total: pdfData.amount,
        quoteNumber: pdfData.quoteNumber,
        executiveName: brand,
      );
      final fileName =
          'Quotation-${pdfData.quoteNumber.isEmpty ? 'No' : pdfData.quoteNumber}.pdf'.replaceAll(RegExp(r'[^\w.-]+'), '_');

      if (!mounted) return;
      final ok = await openWhatsAppWithPdf(
        pdfBase64: pdfB64,
        fileName: fileName,
        message: message,
        phone: phone,
      );
      if (!mounted) return;
      embSnack(
        context,
        ok
            ? (pdfB64 != null ? 'WhatsApp choose karein — PDF attach karke Send' : 'WhatsApp open — message bhej dein')
            : 'WhatsApp open nahi hua',
        error: !ok,
      );
      unawaited(_loadQuotes());
      unawaited(_loadTimeline());
    } catch (e) {
      if (mounted) embSnack(context, apiErrorMessage(e), error: true);
    } finally {
      if (mounted) setState(() => _sharingQuoteId = null);
    }
  }

  Future<void> _scheduleFollowup() async {
    final lead = _lead!;
    final saved = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => FollowupFormScreen(leadId: lead.id, leadName: lead.name)),
    );
    if (saved == true) {
      unawaited(_loadFollowups());
      unawaited(_loadTimeline());
      unawaited(_load(refresh: true));
    }
  }

  Future<void> _changeStatus({String? initial}) async {
    final ok = await showStatusSheet(context, lead: _lead!, role: _role, initial: initial);
    if (ok == true) _refreshAll();
  }

  void _onStageTap(String stage) {
    final lead = _lead!;
    if (isLeadLocked(lead.status)) return;
    if (stage == lead.status) return;
    if (stage == 'converted') {
      if (canConvertStatus(lead.status) && _canConvertRole) {
        _convert();
      } else {
        embSnack(context, 'This lead is closed. Convert is available on open leads.');
      }
      return;
    }
    _changeStatus(initial: stage);
  }

  Future<void> _logCallNote() async {
    final ok = await showCallNoteSheet(context, lead: _lead!, role: _role);
    if (ok == true) {
      unawaited(_loadTimeline());
      unawaited(_load(refresh: true));
    }
  }

  Future<void> _assign() async {
    final ok = await showAssignSheet(context, lead: _lead!);
    if (ok == true) _refreshAll();
  }

  Future<void> _edit() async {
    final saved = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => LeadFormScreen(lead: _lead!)),
    );
    if (saved == true) _refreshAll();
  }

  Future<void> _convert() async {
    final ok = await showConvertSheet(context, lead: _lead!);
    if (ok == true) _refreshAll();
  }

  Future<void> _reactivate() async {
    final ok = await showReactivateSheet(context, lead: _lead!, role: _role);
    if (ok == true) _refreshAll();
  }

  Future<void> _addNote(String text) async {
    try {
      await _svc.addNote(_role, widget.leadId, text);
      if (!mounted) return;
      embSnack(context, 'Note added');
      unawaited(_loadNotes());
      unawaited(_loadTimeline());
    } catch (e) {
      if (mounted) embSnack(context, apiErrorMessage(e), error: true);
      rethrow;
    }
  }

  // -------------------------------------------------------------------------
  // Build
  // -------------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    final lead = _lead;
    final locked = lead != null && isLeadLocked(lead.status);
    final canConvert =
        lead != null && !locked && canConvertStatus(lead.status) && _canConvertRole;
    final hasPhone = (lead?.phone ?? lead?.whatsapp ?? '').isNotEmpty;
    final hasEmail = (lead?.email ?? '').isNotEmpty;

    return Scaffold(
      backgroundColor: EmbTheme.cream,
      appBar: embAppBar(
        lead?.name ?? 'Lead 360',
        actions: [
          if (lead != null)
            IconButton(tooltip: 'Edit lead', onPressed: _edit, icon: const Icon(Icons.edit_outlined)),
          IconButton(tooltip: 'Refresh', onPressed: _loading ? null : _refreshAll, icon: const Icon(Icons.refresh)),
        ],
      ),
      body: _loading && lead == null
          ? const EmbLoading()
          : (_error != null && lead == null)
              ? EmbErrorView(message: _error!, onRetry: _load)
              : Stack(
                  children: [
                    _body(lead!),
                    Positioned(
                      left: 12,
                      right: 12,
                      bottom: 10 + MediaQuery.paddingOf(context).bottom,
                      child: SafeArea(
                        top: false,
                        child: Center(
                          child: ConstrainedBox(
                            constraints: const BoxConstraints(maxWidth: 420),
                            child: LdFloatingQuickBar(
                              hasPhone: hasPhone,
                              hasEmail: hasEmail,
                              onCall: _call,
                              onWhatsApp: _whatsapp,
                              onEmail: _email,
                              onQuote: _createQuote,
                              onFollowUp: _scheduleFollowup,
                              onCallNote: _logCallNote,
                              onStatus: locked ? null : () => _changeStatus(),
                              onConvert: canConvert ? _convert : null,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
    );
  }

  Widget _body(Lead lead) {
    final scores = computeLeadScores(
      lead,
      followupCount: _followups.data.length,
      quoteCount: _quotes.data.length,
    );
    final locked = isLeadLocked(lead.status);
    final activities = buildActivities(
      lead: lead,
      timeline: _timeline.data,
      followups: _followups.data,
      quotations: _quotes.data,
    );
    final bottomPad = 96 + MediaQuery.paddingOf(context).bottom;

    return RefreshIndicator(
      color: EmbTheme.teal,
      onRefresh: _refreshAll,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
        padding: EdgeInsets.fromLTRB(14, 12, 14, bottomPad),
        children: [
          // 1. Header
          LdHeader(lead: lead, scores: scores),

          // 2. Pipeline
          LdPipeline(status: lead.status, onStageTap: locked ? null : _onStageTap),

          // 3. Converted banner
          if (lead.status == 'converted')
            LdConvertedBanner(loading: _bookingLoading, booking: _booking, advance: _advance),

          // 4. Contact actions
          LdContactActions(
            hasPhone: (lead.phone ?? lead.whatsapp ?? '').isNotEmpty,
            hasEmail: (lead.email ?? '').isNotEmpty,
            onCall: _call,
            onWhatsApp: _whatsapp,
            onEmail: _email,
            onQuote: _createQuote,
            onFollowUp: _scheduleFollowup,
            onStatus: locked ? null : () => _changeStatus(),
          ),

          // 5-6. Customer overview + Travel information
          LdCustomerOverview(lead: lead),
          LdTravelInfo(lead: lead),

          // 7. Activity timeline
          LdTimeline(
            activities: activities,
            loading: _timeline.loading,
            error: _timeline.error,
            onOpenQuote: _openQuote,
            onRetry: _loadTimeline,
          ),

          // 8. Quick actions
          LdQuickActions(
            onCallNote: _logCallNote,
            onAssign: _canAssign ? _assign : null,
            onEdit: _edit,
            onConvert: (!locked && canConvertStatus(lead.status) && _canConvertRole) ? _convert : null,
            onStatus: locked ? null : () => _changeStatus(),
            onReactivate: (lead.status == 'lost' && _canReactivate) ? _reactivate : null,
          ),

          // 9. Notes
          LdNotes(
            notes: _notes.data,
            legacyNote: lead.notes,
            loading: _notes.loading,
            error: _notes.error,
            onAdd: _addNote,
          ),

          // 10. Upcoming follow-ups
          LdFollowups(
            followups: _followups.data,
            nextFollowUp: lead.nextFollowUp,
            loading: _followups.loading,
            onSchedule: _scheduleFollowup,
          ),

          // 11. Tags
          LdTags(tags: deriveLeadTags(lead)),

          // 12. Quotations
          LdQuotations(
            quotations: _quotes.data,
            loading: _quotes.loading,
            error: _quotes.error,
            onOpen: (q) => _openQuote(q.id),
            onCreate: _createQuote,
            onShare: _shareQuote,
            onPreview: _previewQuote,
            sharingQuoteId: _sharingQuoteId,
          ),

          // 13. Score breakdown
          LdScoreBreakdown(lead: lead, scores: scores),

          // 14. Email history
          LdEmailHistory(
            rows: _emails.data,
            loading: _emails.loading,
            error: _emails.error,
            onRetry: _loadEmails,
          ),

          // 15. Transfer history
          LdTransferHistory(
            rows: _transfers.data,
            loading: _transfers.loading,
            error: _transfers.error,
            onRetry: _loadTransfers,
          ),

          // 16. Audit trail (admin + sales manager)
          if (_canAudit)
            LdAudit(
              rows: _audit.data,
              loading: _audit.loading,
              error: _audit.error,
              onRetry: _loadAudit,
            ),
        ],
      ),
    );
  }
}
