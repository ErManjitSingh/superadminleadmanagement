import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../core/emb_theme.dart';
import '../models/models.dart';
import '../providers/auth_provider.dart';
import '../providers/notification_hub.dart';
import '../services/leads_service.dart';
import '../widgets/common_widgets.dart' show EmptyState;
import '../widgets/emb_widgets.dart' show embBody, embDisplay;
import '../widgets/lead_list_card.dart';
import 'lead_detail_screen.dart';
import 'lead_form_screen.dart';
import 'notifications_screen.dart';

class LeadsScreen extends StatefulWidget {
  const LeadsScreen({super.key, this.initialFilter});

  /// Menu deep-link filter: all/today/new/contacted/follow-up/hot/converted/lost/
  /// reactivated/unassigned/assigned.
  final String? initialFilter;

  @override
  State<LeadsScreen> createState() => _LeadsScreenState();
}

class _LeadsScreenState extends State<LeadsScreen> {
  final searchCtrl = TextEditingController();
  late String filter = _normalize(widget.initialFilter);
  bool loading = true;
  String? error;
  List<Lead> leads = [];
  int total = 0;
  final Set<String> _expanded = {};
  NotificationHub? _hub;
  int _leadEpoch = 0;

  /// Collapsing chrome (title → search → filters).
  bool _headerVisible = true;
  double _headerAccum = 0;

  static String _normalize(String? f) {
    final v = (f ?? 'all').trim().toLowerCase();
    return v.isEmpty ? 'all' : v;
  }

  static const _baseFilters = [
    ('all', 'All'),
    ('today', 'Today'),
    ('new', 'New'),
    ('contacted', 'Contacted'),
    ('follow-up', 'Follow-up'),
    ('hot', 'Hot'),
    ('reactivated', 'Reactivated'),
    ('converted', 'Converted'),
    ('lost', 'Lost'),
  ];

  List<(String, String)> get filters {
    final role = context.read<AuthProvider>().user?.role ?? 'sales_executive';
    final list = [..._baseFilters];
    if (role != 'sales_executive') {
      list.insert(1, ('unassigned', 'Unassigned'));
      list.insert(2, ('assigned', 'Assigned'));
    }
    if (!list.any((f) => f.$1 == filter)) {
      list.insert(1, (filter, _labelFor(filter)));
    }
    return list;
  }

  String _labelFor(String f) {
    switch (f) {
      case 'today':
        return 'Today';
      case 'follow-up':
        return 'Follow-up';
      case 'unassigned':
        return 'Unassigned';
      case 'assigned':
        return 'Assigned';
      default:
        if (f.isEmpty) return 'All';
        return f[0].toUpperCase() + f.substring(1);
    }
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final hub = context.read<NotificationHub>();
    if (!identical(hub, _hub)) {
      _hub?.removeListener(_onHubChanged);
      _hub = hub;
      _leadEpoch = hub.leadContentEpoch;
      _hub!.addListener(_onHubChanged);
    }
  }

  void _onHubChanged() {
    final e = _hub?.leadContentEpoch ?? 0;
    if (e == _leadEpoch) return;
    _leadEpoch = e;
    if (mounted) _load();
  }

  @override
  void didUpdateWidget(covariant LeadsScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    final next = _normalize(widget.initialFilter);
    if (next != _normalize(oldWidget.initialFilter)) {
      filter = next;
      _load();
    }
  }

  @override
  void dispose() {
    _hub?.removeListener(_onHubChanged);
    searchCtrl.dispose();
    super.dispose();
  }

  bool _isToday(String? iso) {
    if (iso == null || iso.isEmpty) return false;
    final dt = DateTime.tryParse(iso);
    if (dt == null) return false;
    final local = dt.toLocal();
    final now = DateTime.now();
    return local.year == now.year && local.month == now.month && local.day == now.day;
  }

  bool _matchesFilter(Lead lead, String f) {
    final status = lead.status.toLowerCase();
    switch (f) {
      case 'all':
        return true;
      case 'today':
        return _isToday(lead.createdAt);
      case 'new':
        return status == 'new';
      case 'contacted':
        return status == 'contacted';
      case 'follow-up':
        return status == 'follow_up' || status == 'follow-up' || status == 'negotiation';
      case 'converted':
        return status == 'converted';
      case 'lost':
        return status == 'lost' || status == 'booked_from_another_company';
      case 'hot':
        final temp = (lead.temperature ?? '').toLowerCase();
        final score = (lead.leadScore ?? '').toLowerCase();
        return lead.isHot || temp == 'hot' || temp == 'vip' || score == 'hot';
      case 'reactivated':
        final raw = lead.raw;
        if (raw != null) {
          final r = raw['reactivation'];
          if (r is Map && r['isReactivated'] == true) return true;
          if (raw['isReactivated'] == true) return true;
        }
        return status == 'reactivated';
      case 'unassigned':
        return (lead.assignedToId == null || lead.assignedToId!.isEmpty) &&
            (lead.assignedToName == null || lead.assignedToName!.isEmpty);
      case 'assigned':
        return (lead.assignedToId != null && lead.assignedToId!.isNotEmpty) ||
            (lead.assignedToName != null && lead.assignedToName!.isNotEmpty);
      default:
        return status == f;
    }
  }

  bool _onScroll(ScrollNotification n) {
    if (n.metrics.axis != Axis.vertical) return false;

    if (n is ScrollUpdateNotification) {
      final delta = n.scrollDelta ?? 0;
      final pixels = n.metrics.pixels;

      // Always reveal at the very top.
      if (pixels <= 2) {
        _headerAccum = 0;
        if (!_headerVisible) setState(() => _headerVisible = true);
        return false;
      }

      // Accumulate small deltas so tiny jitters don't flicker.
      _headerAccum += delta;
      if (_headerAccum > 14 && _headerVisible) {
        setState(() => _headerVisible = false);
        _headerAccum = 0;
      } else if (_headerAccum < -10 && !_headerVisible) {
        setState(() => _headerVisible = true);
        _headerAccum = 0;
      }
    }
    return false;
  }

  Future<void> _load() async {
    final role = context.read<AuthProvider>().user?.role ?? 'sales_executive';
    setState(() {
      loading = true;
      error = null;
    });
    try {
      final limit = filter == 'all' ? 40 : 100;
      final result = await context.read<LeadsService>().fetchLeads(
            role,
            filter: filter,
            search: searchCtrl.text.trim(),
            limit: limit,
          );
      if (!mounted) return;
      final items = filter == 'all'
          ? result.items
          : result.items.where((l) => _matchesFilter(l, filter)).toList();
      setState(() {
        leads = items;
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

  Future<void> _openLead(Lead lead) async {
    await Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => LeadDetailScreen(leadId: lead.id)),
    );
    if (mounted) _load();
  }

  int get _hotCount => leads.where((l) => l.isHot).length;
  int get _newCount => leads.where((l) => l.status.toLowerCase() == 'new').length;

  Widget _buildCollapsingHeader(double topPad) {
    return AnimatedSize(
      duration: const Duration(milliseconds: 260),
      curve: Curves.easeInOutCubic,
      alignment: Alignment.topCenter,
      child: AnimatedOpacity(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOut,
        opacity: _headerVisible ? 1 : 0,
        child: _headerVisible
            ? Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  SizedBox(height: topPad + 4),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 8, 8),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text('Leads', style: embDisplay(size: 26, weight: FontWeight.w700)),
                        ),
                        Consumer<NotificationHub>(
                          builder: (context, hub, _) {
                            return IconButton(
                              tooltip: 'Notifications',
                              onPressed: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(builder: (_) => const NotificationsScreen()),
                                );
                              },
                              icon: Badge(
                                isLabelVisible: hub.unreadCount > 0,
                                label: Text(
                                  hub.unreadCount > 99 ? '99+' : '${hub.unreadCount}',
                                  style: const TextStyle(fontSize: 10),
                                ),
                                child: const Icon(Icons.notifications_outlined, color: EmbTheme.ink),
                              ),
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 0),
                    child: Container(
                      decoration: BoxDecoration(
                        color: EmbTheme.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: EmbTheme.border),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.04),
                            blurRadius: 10,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: TextField(
                        controller: searchCtrl,
                        style: embBody(size: 14, weight: FontWeight.w600),
                        decoration: InputDecoration(
                          hintText: 'Search name, phone, destination…',
                          hintStyle: embBody(size: 14, color: EmbTheme.muted),
                          prefixIcon: const Icon(Icons.search_rounded, color: EmbTheme.teal),
                          suffixIcon: IconButton(
                            tooltip: 'Search',
                            onPressed: _load,
                            icon: const Icon(Icons.arrow_forward_rounded, color: EmbTheme.ink),
                          ),
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 14),
                        ),
                        textInputAction: TextInputAction.search,
                        onSubmitted: (_) => _load(),
                      ),
                    ),
                  ),
                  SizedBox(
                    height: 52,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      children: [
                        for (final f in filters)
                          Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: FilterChip(
                              label: Text(
                                f.$2,
                                style: GoogleFonts.plusJakartaSans(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 12.5,
                                  color: filter == f.$1 ? EmbTheme.teal : EmbTheme.inkSoft,
                                ),
                              ),
                              selected: filter == f.$1,
                              selectedColor: EmbTheme.tealSoft,
                              checkmarkColor: EmbTheme.teal,
                              backgroundColor: EmbTheme.white,
                              side: BorderSide(
                                color: filter == f.$1
                                    ? EmbTheme.teal.withValues(alpha: 0.35)
                                    : EmbTheme.border,
                              ),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                              onSelected: (_) {
                                setState(() => filter = f.$1);
                                _load();
                              },
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              )
            : SizedBox(width: double.infinity, height: topPad > 0 ? topPad * 0.35 : 0),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final topPad = MediaQuery.paddingOf(context).top;

    return Scaffold(
      backgroundColor: EmbTheme.cream,
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: EmbTheme.teal,
        foregroundColor: Colors.white,
        onPressed: () async {
          final saved = await Navigator.of(context).push<bool>(
            MaterialPageRoute(builder: (_) => const LeadFormScreen()),
          );
          if (saved == true && mounted) _load();
        },
        icon: const Icon(Icons.person_add_alt_1_rounded),
        label: const Text('New lead'),
      ),
      body: NotificationListener<ScrollNotification>(
        onNotification: _onScroll,
        child: Column(
          children: [
            _buildCollapsingHeader(topPad),
            if (!loading && error == null)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
                child: Row(
                  children: [
                    Text(
                      leads.isEmpty
                          ? 'No leads'
                          : '${leads.length}${total > leads.length ? ' of $total' : ''} leads',
                      style: embDisplay(size: 15, weight: FontWeight.w700),
                    ),
                    const Spacer(),
                    if (_hotCount > 0)
                      _StatPill(label: '$_hotCount hot', color: EmbTheme.saffron, soft: EmbTheme.saffronSoft),
                    if (_newCount > 0) ...[
                      const SizedBox(width: 6),
                      _StatPill(label: '$_newCount new', color: EmbTheme.mint, soft: EmbTheme.mintSoft),
                    ],
                  ],
                ),
              ),
            Expanded(
              child: loading
                  ? const Center(child: CircularProgressIndicator(color: EmbTheme.teal))
                  : error != null
                      ? Center(
                          child: Padding(
                            padding: const EdgeInsets.all(24),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(error!, textAlign: TextAlign.center, style: embBody(color: EmbTheme.inkSoft)),
                                const SizedBox(height: 12),
                                FilledButton(
                                  style: FilledButton.styleFrom(backgroundColor: EmbTheme.teal),
                                  onPressed: _load,
                                  child: const Text('Retry'),
                                ),
                              ],
                            ),
                          ),
                        )
                      : RefreshIndicator(
                          color: EmbTheme.teal,
                          onRefresh: _load,
                          child: leads.isEmpty
                              ? ListView(
                                  physics: const AlwaysScrollableScrollPhysics(),
                                  children: const [
                                    SizedBox(height: 80),
                                    EmptyState(
                                      message: 'No leads found',
                                      icon: Icons.people_outline_rounded,
                                    ),
                                  ],
                                )
                              : ListView.builder(
                                  physics: const AlwaysScrollableScrollPhysics(
                                    parent: BouncingScrollPhysics(),
                                  ),
                                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
                                  itemCount: leads.length,
                                  itemBuilder: (_, i) {
                                    final lead = leads[i];
                                    final open = _expanded.contains(lead.id);
                                    return LeadListCard(
                                      lead: lead,
                                      expanded: open,
                                      onToggleMore: () {
                                        setState(() {
                                          if (open) {
                                            _expanded.remove(lead.id);
                                          } else {
                                            _expanded.add(lead.id);
                                          }
                                        });
                                      },
                                      onTap: () => _openLead(lead),
                                    );
                                  },
                                ),
                        ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatPill extends StatelessWidget {
  const _StatPill({required this.label, required this.color, required this.soft});
  final String label;
  final Color color;
  final Color soft;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(color: soft, borderRadius: BorderRadius.circular(999)),
      child: Text(label, style: embBody(size: 11.5, weight: FontWeight.w800, color: color)),
    );
  }
}
