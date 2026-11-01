import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../core/emb_theme.dart';
import '../models/models.dart';
import '../providers/auth_provider.dart';
import '../services/quotation_send_helper.dart';
import '../services/quotations_service.dart';
import '../widgets/common_widgets.dart' show EmptyState, formatMoney, formatDate;
import '../widgets/emb_widgets.dart';
import 'quote_builder_screen.dart';
import 'quote_detail_screen.dart';

/// Native quotations list → [QuoteDetailScreen] / [QuoteBuilderScreen].
class QuotesScreen extends StatefulWidget {
  const QuotesScreen({super.key, this.initialStatus = ''});

  /// Menu deep-link: '', draft, sent, pending, negotiation, approved, rejected.
  final String initialStatus;

  @override
  State<QuotesScreen> createState() => _QuotesScreenState();
}

class _QuotesScreenState extends State<QuotesScreen> {
  bool loading = true;
  String? error;
  List<Quotation> quotes = [];
  int total = 0;
  late String status = widget.initialStatus;
  final searchCtrl = TextEditingController();
  String? _sendingId;

  static const _filters = [
    ('', 'All'),
    ('draft', 'Draft'),
    ('sent', 'Sent'),
    ('pending', 'Pending'),
    ('negotiation', 'Negotiation'),
    ('approved', 'Approved'),
    ('rejected', 'Rejected'),
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    searchCtrl.dispose();
    super.dispose();
  }

  @override
  void didUpdateWidget(covariant QuotesScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.initialStatus != widget.initialStatus) {
      status = widget.initialStatus;
      _load();
    }
  }

  Future<void> _load() async {
    final role = context.read<AuthProvider>().user?.role ?? 'sales_executive';
    setState(() {
      loading = true;
      error = null;
    });
    try {
      final result = await context.read<QuotationsService>().fetchQuotations(
            role,
            status: status,
            search: searchCtrl.text.trim(),
            limit: 100,
          );
      if (!mounted) return;
      setState(() {
        quotes = result.items;
        total = result.total;
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

  Future<void> _openBuilder() async {
    final saved = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => const QuoteBuilderScreen()),
    );
    if (saved == true) _load();
  }

  Future<void> _openQuote(Quotation q) async {
    if (q.id.isEmpty) {
      embSnack(context, 'Quotation id missing', error: true);
      return;
    }
    await Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => QuoteDetailScreen(quoteId: q.id)),
    );
    if (mounted) _load();
  }

  Future<void> _sendQuote(Quotation q) async {
    if (q.id.isEmpty) return;
    final phone = (q.leadPhone ?? '').trim();
    if (phone.isEmpty) {
      embSnack(context, 'Lead phone missing — pehle lead pe phone add karein', error: true);
      return;
    }
    final role = context.read<AuthProvider>().user?.role ?? 'sales_executive';
    final svc = context.read<QuotationsService>();
    final exec = executiveNameFromAuth(context.read<AuthProvider>());
    setState(() => _sendingId = q.id);
    try {
      final detail = await svc.fetchQuotation(role, q.id);
      if (!mounted) return;
      if (detail.id.isEmpty) {
        embSnack(context, 'Quotation not found', error: true);
        return;
      }
      final result = await sendQuotationWhatsApp(
        svc: svc,
        role: role,
        quote: detail,
        executiveName: exec,
      );
      if (!mounted) return;
      embSnack(context, result.message, error: !result.ok);
      if (result.ok) _load();
    } catch (e) {
      if (mounted) embSnack(context, apiErrorMessage(e), error: true);
    } finally {
      if (mounted) setState(() => _sendingId = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: EmbTheme.cream,
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: EmbTheme.teal,
        foregroundColor: Colors.white,
        onPressed: _openBuilder,
        icon: const Icon(Icons.add),
        label: const Text('New Quote'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 10, 12, 4),
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: EmbTheme.border),
              ),
              child: TextField(
                controller: searchCtrl,
                style: embBody(size: 14, weight: FontWeight.w600),
                decoration: InputDecoration(
                  hintText: 'Search lead, phone, quote no, destination…',
                  hintStyle: embBody(size: 13, color: EmbTheme.muted),
                  prefixIcon: const Icon(Icons.search_rounded, color: EmbTheme.teal),
                  suffixIcon: searchCtrl.text.isEmpty
                      ? IconButton(
                          tooltip: 'Search',
                          onPressed: _load,
                          icon: const Icon(Icons.arrow_forward_rounded, color: EmbTheme.ink),
                        )
                      : IconButton(
                          tooltip: 'Clear',
                          onPressed: () {
                            searchCtrl.clear();
                            setState(() {});
                            _load();
                          },
                          icon: const Icon(Icons.close_rounded, color: EmbTheme.muted),
                        ),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 14),
                ),
                textInputAction: TextInputAction.search,
                onChanged: (_) => setState(() {}),
                onSubmitted: (_) => _load(),
              ),
            ),
          ),
          SizedBox(
            height: 46,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              children: [
                for (final f in _filters)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: ChoiceChip(
                      label: Text(f.$2),
                      selected: status == f.$1,
                      selectedColor: EmbTheme.tealSoft,
                      onSelected: (_) {
                        setState(() => status = f.$1);
                        _load();
                      },
                    ),
                  ),
              ],
            ),
          ),
          if (!loading && error == null && quotes.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 4),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  total > quotes.length
                      ? 'Showing ${quotes.length} of $total'
                      : '${quotes.length} quotation${quotes.length == 1 ? '' : 's'}',
                  style: embBody(size: 12, color: EmbTheme.muted),
                ),
              ),
            ),
          Expanded(
            child: loading
                ? const EmbLoading()
                : error != null
                    ? EmbErrorView(message: error!, onRetry: _load)
                    : RefreshIndicator(
                        color: EmbTheme.teal,
                        onRefresh: _load,
                        child: quotes.isEmpty
                            ? ListView(
                                physics: const AlwaysScrollableScrollPhysics(),
                                children: [
                                  EmptyState(
                                    message: searchCtrl.text.trim().isEmpty
                                        ? 'No quotations found'
                                        : 'No quotations match “${searchCtrl.text.trim()}”',
                                  ),
                                ],
                              )
                            : ListView.builder(
                                physics: const AlwaysScrollableScrollPhysics(),
                                padding: const EdgeInsets.fromLTRB(16, 4, 16, 96),
                                itemCount: quotes.length,
                                itemBuilder: (_, i) => _tile(quotes[i]),
                              ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _tile(Quotation q) {
    final sending = _sendingId == q.id;
    final phone = (q.leadPhone ?? '').trim();
    final dest = (q.destination ?? q.leadDestination ?? '').trim();
    final pax = [
      if (q.adults > 0) '${q.adults} Adult${q.adults > 1 ? 's' : ''}',
      if (q.children > 0) '${q.children} Child${q.children > 1 ? 'ren' : ''}',
    ].join(', ');

    return EmbCard(
      onTap: () => _openQuote(q),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  q.quoteNumber?.isNotEmpty == true ? q.quoteNumber! : q.packageName,
                  style: embBody(size: 16, weight: FontWeight.w700),
                ),
              ),
              EmbPill(prettyStatus(q.status ?? 'draft'), color: statusTone(q.status)),
            ],
          ),
          if (q.quoteNumber?.isNotEmpty == true && q.packageName.isNotEmpty) ...[
            const SizedBox(height: 2),
            Text(q.packageName, style: embBody(size: 13, color: EmbTheme.inkSoft)),
          ],
          const SizedBox(height: 10),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: EmbTheme.tealSoft.withValues(alpha: 0.35),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Lead details',
                  style: embBody(size: 11, weight: FontWeight.w800, color: EmbTheme.teal),
                ),
                const SizedBox(height: 4),
                Text(
                  q.leadName?.isNotEmpty == true ? q.leadName! : 'Lead',
                  style: embBody(size: 14, weight: FontWeight.w700),
                ),
                if (phone.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(phone, style: embBody(size: 13, color: EmbTheme.inkSoft)),
                  ),
                if ((q.leadEmail ?? '').trim().isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(q.leadEmail!.trim(), style: embBody(size: 12, color: EmbTheme.muted)),
                  ),
                if (dest.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text('Destination: $dest', style: embBody(size: 12, color: EmbTheme.inkSoft)),
                  ),
                if ((q.leadTravelDate ?? '').isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(
                      'Travel: ${formatDate(q.leadTravelDate)}',
                      style: embBody(size: 12, color: EmbTheme.inkSoft),
                    ),
                  ),
                if (pax.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(pax, style: embBody(size: 12, color: EmbTheme.inkSoft)),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: Text(
                  [
                    if ((q.createdAt ?? '').isNotEmpty) formatDate(q.createdAt),
                    if ((q.sentAt ?? '').isNotEmpty) 'Sent ${formatDate(q.sentAt)}',
                  ].join(' · '),
                  style: embBody(size: 12, color: EmbTheme.muted),
                ),
              ),
              Text(formatMoney(q.total), style: embBody(size: 14, weight: FontWeight.w800)),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: sending ? null : () => _openQuote(q),
                  icon: const Icon(Icons.visibility_outlined, size: 18),
                  label: const Text('Open'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: FilledButton.icon(
                  style: FilledButton.styleFrom(
                    backgroundColor: EmbTheme.teal,
                    foregroundColor: Colors.white,
                  ),
                  onPressed: sending ? null : () => _sendQuote(q),
                  icon: sending
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Icon(Icons.chat, size: 18),
                  label: Text(sending ? 'Sending…' : 'Send'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
