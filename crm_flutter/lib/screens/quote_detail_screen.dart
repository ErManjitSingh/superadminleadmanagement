import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../core/api_client.dart';
import '../core/emb_theme.dart';
import '../models/models.dart';
import '../providers/auth_provider.dart';
import '../services/quotation_pdf_builder.dart';
import '../services/quotation_send_helper.dart';
import '../services/quotations_service.dart';
import '../widgets/common_widgets.dart' show formatMoney, formatDate;
import '../widgets/emb_widgets.dart';
import 'quotation_pdf_preview_screen.dart';
import 'quote_builder_screen.dart';

/// Native quotation detail with PDF preview + WhatsApp send.
class QuoteDetailScreen extends StatefulWidget {
  const QuoteDetailScreen({super.key, required this.quoteId});
  final String quoteId;

  @override
  State<QuoteDetailScreen> createState() => _QuoteDetailScreenState();
}

class _QuoteDetailScreenState extends State<QuoteDetailScreen> {
  bool loading = true;
  bool busy = false;
  String? error;
  QuotationDetail? quote;

  String get _role => context.read<AuthProvider>().user?.role ?? 'sales_executive';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if (widget.quoteId.trim().isEmpty) {
      setState(() {
        loading = false;
        error = 'Quotation id missing';
      });
      return;
    }
    setState(() {
      loading = true;
      error = null;
    });
    try {
      final q = await context.read<QuotationsService>().fetchQuotation(_role, widget.quoteId);
      if (!mounted) return;
      if (q.id.isEmpty) {
        setState(() {
          error = 'Quotation not found';
          loading = false;
        });
        return;
      }
      setState(() {
        quote = q;
        loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        error = apiErrorMessage(e);
        loading = false;
      });
    }
  }

  Future<void> _edit() async {
    final q = quote!;
    final saved = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => QuoteBuilderScreen(quoteId: q.id, leadId: q.leadId)),
    );
    if (saved == true) _load();
  }

  Future<void> _openPdf(String url) async {
    final api = context.read<ApiClient>().apiBaseUrl;
    final resolved = resolvePublicPdfUrl(url, api);
    if (resolved.isEmpty) {
      embSnack(context, 'PDF URL missing', error: true);
      return;
    }
    final ok = await launchUrl(Uri.parse(resolved), mode: LaunchMode.externalApplication);
    if (!ok && mounted) embSnack(context, 'Could not open PDF', error: true);
  }

  Future<void> _previewPdf() async {
    final q = quote;
    if (q == null) return;
    final auth = context.read<AuthProvider>().user;
    final exec = (auth?.name != null && auth!.name.isNotEmpty) ? auth.name : 'Explore My Bharat';
    final data = QuotationPdfData.fromDetail(q, executiveName: exec);
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => QuotationPdfPreviewScreen(
          title: q.quoteNumber.isEmpty ? 'Quotation PDF' : q.quoteNumber,
          htmlFuture: buildQuotationPreviewHtml(data),
        ),
      ),
    );
  }

  Future<void> _sendWhatsApp() async {
    final q = quote;
    if (q == null) return;
    if (q.leadPhone.trim().isEmpty) {
      embSnack(context, 'Customer phone missing on lead', error: true);
      return;
    }
    final svc = context.read<QuotationsService>();
    final role = _role;
    final brand = executiveNameFromAuth(context.read<AuthProvider>());
    setState(() => busy = true);
    try {
      final result = await sendQuotationWhatsApp(
        svc: svc,
        role: role,
        quote: q,
        executiveName: brand,
      );
      if (!mounted) return;
      embSnack(context, result.message, error: !result.ok);
      await _load();
    } catch (e) {
      if (mounted) embSnack(context, apiErrorMessage(e), error: true);
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final q = quote;
    return Scaffold(
      backgroundColor: EmbTheme.cream,
      appBar: embAppBar(q?.quoteNumber.isNotEmpty == true ? q!.quoteNumber : 'Quotation', actions: [
        if (q != null) IconButton(icon: const Icon(Icons.edit_outlined), tooltip: 'Edit', onPressed: _edit),
      ]),
      body: loading
          ? const EmbLoading()
          : error != null || q == null
              ? EmbErrorView(message: error ?? 'Not found', onRetry: _load)
              : RefreshIndicator(
                  color: EmbTheme.teal,
                  onRefresh: _load,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: _sections(q),
                  ),
                ),
    );
  }

  List<Widget> _sections(QuotationDetail q) {
    return [
      EmbCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(q.packageName, style: embBody(size: 20, weight: FontWeight.w800)),
                ),
                EmbPill(prettyStatus(q.status), color: statusTone(q.status)),
              ],
            ),
            const SizedBox(height: 6),
            Text(formatMoney(q.total),
                style: embBody(size: 26, weight: FontWeight.w800, color: EmbTheme.teal)),
            const SizedBox(height: 8),
            _row('Customer', q.leadName),
            if (q.leadPhone.isNotEmpty) _row('Phone', q.leadPhone),
            _row('Destination', q.destination.isEmpty ? '—' : q.destination),
            _row('Duration', q.duration > 0 ? '${q.duration} days' : '—'),
            _row('Travellers', '${q.adults} adults, ${q.children} children'),
            if (QuotationPdfData.fromDetail(q).hasHotels) ...[
              _row('Meal plan', q.mealPlan.isEmpty ? '—' : q.mealPlan),
              _row('Hotel category', q.hotelCategory.isEmpty ? '—' : q.hotelCategory),
            ] else
              _row('Package type', 'Cab only (no hotel / meals)'),
            _row('Travel date', q.travelDate.isEmpty ? '—' : formatDate(q.travelDate)),
            _row('Created', formatDate(q.createdAt)),
            if (q.sentAt.isNotEmpty) _row('Sent', formatDate(q.sentAt)),
          ],
        ),
      ),
      EmbPrimaryButton(
        label: busy ? 'Working…' : 'Send on WhatsApp',
        icon: Icons.chat,
        busy: busy,
        onPressed: busy ? null : _sendWhatsApp,
      ),
      const SizedBox(height: 8),
      Row(
        children: [
          Expanded(
            child: OutlinedButton.icon(
              onPressed: busy ? null : _previewPdf,
              icon: const Icon(Icons.picture_as_pdf_outlined),
              label: const Text('Preview PDF'),
            ),
          ),
          if (q.pdfUrl != null) ...[
            const SizedBox(width: 10),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: busy ? null : () => _openPdf(q.pdfUrl!),
                icon: const Icon(Icons.open_in_new, color: EmbTheme.danger),
                label: const Text('Open saved'),
              ),
            ),
          ],
        ],
      ),
      if (q.itinerary.isNotEmpty) ...[
        const EmbSectionTitle('Itinerary'),
        for (var i = 0; i < q.itinerary.length; i++)
          EmbCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                    'Day ${q.itinerary[i]['day'] ?? i + 1}: ${q.itinerary[i]['title'] ?? q.itinerary[i]['name'] ?? ''}',
                    style: embBody(size: 15, weight: FontWeight.w700)),
                if ('${q.itinerary[i]['description'] ?? q.itinerary[i]['activities'] ?? ''}'.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      '${q.itinerary[i]['description'] ?? q.itinerary[i]['activities']}',
                      style: embBody(size: 13, color: EmbTheme.inkSoft),
                    ),
                  ),
              ],
            ),
          ),
      ],
      if (q.selectedHotels.isNotEmpty) ...[
        const EmbSectionTitle('Hotels'),
        for (final h in q.selectedHotels)
          EmbCard(
            child: Row(
              children: [
                const Icon(Icons.hotel, color: EmbTheme.teal),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    '${h['name'] ?? h['hotelName'] ?? 'Hotel'} • ${h['nights'] ?? 1}N'
                    '${(h['roomType'] ?? '').toString().isEmpty ? '' : ' • ${h['roomType']}'}',
                    style: embBody(weight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          ),
      ],
      if (q.selectedCabs.isNotEmpty) ...[
        const EmbSectionTitle('Transport'),
        for (final c in q.selectedCabs)
          EmbCard(
            child: Row(
              children: [
                const Icon(Icons.directions_car, color: EmbTheme.sky),
                const SizedBox(width: 10),
                Expanded(
                  child: Text('${c['vehicleName'] ?? 'Vehicle'} × ${c['vehicleCount'] ?? 1}',
                      style: embBody(weight: FontWeight.w600)),
                ),
                Text(formatMoney(num.tryParse('${c['cost'] ?? 0}') ?? 0), style: embBody(weight: FontWeight.w700)),
              ],
            ),
          ),
      ],
      if (q.paymentPlan.isNotEmpty) ...[
        const EmbSectionTitle('Payment plan'),
        EmbCard(
          child: Column(
            children: [
              for (final p in q.paymentPlan)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Row(
                    children: [
                      Expanded(child: Text('${p['label'] ?? 'Payment'} (${p['percent'] ?? 0}%)', style: embBody())),
                      Text(formatMoney(num.tryParse('${p['amount'] ?? 0}') ?? 0),
                          style: embBody(weight: FontWeight.w700)),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ],
      if (q.notes.isNotEmpty) ...[
        const EmbSectionTitle('Notes'),
        EmbCard(child: Text(q.notes, style: embBody(color: EmbTheme.inkSoft))),
      ],
      const SizedBox(height: 8),
      EmbPrimaryButton(label: 'Edit quotation', icon: Icons.edit, onPressed: busy ? null : _edit),
    ];
  }

  Widget _row(String k, String v) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 3),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(width: 120, child: Text(k, style: embBody(size: 13, color: EmbTheme.muted))),
            Expanded(child: Text(v, style: embBody(size: 14, weight: FontWeight.w600))),
          ],
        ),
      );
}
