import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../core/emb_theme.dart';
import '../core/roles.dart';
import '../models/models.dart';
import '../providers/auth_provider.dart';
import '../providers/notification_hub.dart';
import '../services/leads_service.dart';
import '../widgets/common_widgets.dart' show StatusBadge, formatMoney;
import 'lead_detail_screen.dart';
import '../core/crm_navigation.dart';
import 'menu_screen.dart';
import 'notifications_screen.dart';

const _heroImage =
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1400&q=80';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> with SingleTickerProviderStateMixin {
  bool loading = true;
  String? error;
  DashboardData? data;
  late final AnimationController _enter;
  int _recentVisible = 4;
  final Set<String> _expandedLeadIds = {};
  NotificationHub? _hub;
  int _leadEpoch = 0;

  @override
  void initState() {
    super.initState();
    _enter = AnimationController(vsync: this, duration: const Duration(milliseconds: 900));
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
  void dispose() {
    _hub?.removeListener(_onHubChanged);
    _enter.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final auth = context.read<AuthProvider>();
    final role = auth.user?.role ?? 'sales_executive';
    setState(() {
      loading = true;
      error = null;
    });
    try {
      final dash = await context.read<LeadsService>().fetchDashboard(role);
      if (!mounted) return;
      setState(() {
        data = dash;
        loading = false;
      });
      _enter.forward(from: 0);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        error = e.toString();
        loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final topPad = MediaQuery.paddingOf(context).top;

    if (loading) {
      return _ScaffoldBg(
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(
                width: 36,
                height: 36,
                child: CircularProgressIndicator(strokeWidth: 2.5, color: EmbTheme.teal),
              ),
              const SizedBox(height: 14),
              Text('Preparing your desk…', style: GoogleFonts.plusJakartaSans(color: EmbTheme.inkSoft)),
            ],
          ),
        ),
      );
    }

    if (error != null || data == null) {
      return _ScaffoldBg(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(28),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.cloud_off_outlined, size: 40, color: EmbTheme.muted),
                const SizedBox(height: 12),
                Text(
                  error ?? 'Could not load dashboard',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.plusJakartaSans(color: EmbTheme.inkSoft),
                ),
                const SizedBox(height: 16),
                FilledButton(
                  style: FilledButton.styleFrom(backgroundColor: EmbTheme.teal),
                  onPressed: _load,
                  child: const Text('Try again'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final auth = context.watch<AuthProvider>();
    final dash = data!;
    final kpis = dash.kpis;
    final firstName = auth.user?.name.split(' ').first ?? 'there';
    final roleLabel = roleLabels[auth.user?.role] ?? auth.user?.role ?? '';
    final today = DateFormat('EEEE · d MMM').format(DateTime.now());

    final total = kpis['totalLeads']?.toInt() ?? 0;
    final hot = kpis['hotLeads']?.toInt() ?? 0;
    final follow = kpis['todayFollowups']?.toInt() ?? 0;
    final won = kpis['convertedLeads']?.toInt() ?? 0;
    final newToday = kpis['newLeadsToday']?.toInt() ?? 0;
    final quotes = kpis['quotationsSent']?.toInt() ?? 0;
    final overdue = kpis['overdueFollowups']?.toInt() ?? 0;
    final revenue = kpis['revenue'];

    final fade = CurvedAnimation(parent: _enter, curve: Curves.easeOutCubic);
    final slide = Tween<Offset>(begin: const Offset(0, 0.06), end: Offset.zero).animate(fade);

    return _ScaffoldBg(
      child: RefreshIndicator(
        color: EmbTheme.teal,
        onRefresh: _load,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
          slivers: [
            SliverToBoxAdapter(
              child: _HeroBanner(
                topPad: topPad,
                firstName: firstName,
                roleLabel: roleLabel,
                today: today,
                total: total,
                newToday: newToday,
                hot: hot,
                follow: follow,
                won: won,
                onNotify: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const NotificationsScreen()),
                  );
                },
              ),
            ),
            SliverToBoxAdapter(
              child: FadeTransition(
                opacity: fade,
                child: SlideTransition(
                  position: slide,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(18, 8, 18, 110),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _QuickStrip(role: auth.user?.role),
                        const SizedBox(height: 18),
                        _DeskBriefing(
                          firstName: firstName,
                          total: total,
                          hot: hot,
                          follow: follow,
                          overdue: overdue,
                          newToday: newToday,
                          quotes: quotes,
                          won: won,
                        ),
                        const SizedBox(height: 18),
                        _AttentionRow(
                          overdue: overdue,
                          newToday: newToday,
                          hot: hot,
                          follow: follow,
                        ),
                        const SizedBox(height: 22),
                        _SectionTitle(
                          title: 'Today at a glance',
                          action: overdue > 0 ? '$overdue overdue' : null,
                          actionColor: EmbTheme.coral,
                          onAction: overdue > 0
                              ? () => openCrmModule(context, 'followups', title: 'Follow-ups')
                              : null,
                        ),
                        const SizedBox(height: 12),
                        _MetricRow(
                          items: [
                            _Metric(
                              label: 'Hot leads',
                              value: '$hot',
                              icon: Icons.local_fire_department_rounded,
                              color: EmbTheme.saffron,
                              soft: EmbTheme.saffronSoft,
                              onTap: () => openCrmModule(context, 'leads', filter: 'hot', title: 'Hot Leads'),
                            ),
                            _Metric(
                              label: 'Follow-ups',
                              value: '$follow',
                              icon: Icons.event_available_rounded,
                              color: EmbTheme.sky,
                              soft: EmbTheme.skySoft,
                              onTap: () => openCrmModule(context, 'followups', title: 'Follow-ups'),
                            ),
                            _Metric(
                              label: 'Won',
                              value: '$won',
                              icon: Icons.emoji_events_rounded,
                              color: EmbTheme.mint,
                              soft: EmbTheme.mintSoft,
                              onTap: () => openCrmModule(context, 'leads', filter: 'converted', title: 'Converted'),
                            ),
                            _Metric(
                              label: 'Quotes',
                              value: '$quotes',
                              icon: Icons.description_rounded,
                              color: EmbTheme.teal,
                              soft: EmbTheme.tealSoft,
                              onTap: () => openCrmModule(context, 'quotes', title: 'Quotations'),
                            ),
                          ],
                        ),
                        if (revenue != null && revenue > 0) ...[
                          const SizedBox(height: 12),
                          _RevenueChip(amount: revenue),
                        ],
                        const SizedBox(height: 26),
                        _SectionTitle(
                          title: 'Recent leads',
                          action: dash.recentLeads.isEmpty
                              ? null
                              : '${dash.recentLeads.length} latest',
                          onAction: () => openCrmModule(context, 'leads', title: 'Leads'),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Tap a lead for full 360° · Read more for notes',
                          style: GoogleFonts.plusJakartaSans(
                            color: EmbTheme.muted,
                            fontSize: 12.5,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 12),
                        if (dash.recentLeads.isEmpty)
                          _EmptyLeads(
                            onAdd: () => openCrmModule(context, 'leads', title: 'Leads'),
                          )
                        else ...[
                          ...dash.recentLeads.take(_recentVisible).map((l) {
                            final expanded = _expandedLeadIds.contains(l.id);
                            return _RecentLeadCard(
                              lead: l,
                              expanded: expanded,
                              onToggleMore: () {
                                setState(() {
                                  if (expanded) {
                                    _expandedLeadIds.remove(l.id);
                                  } else {
                                    _expandedLeadIds.add(l.id);
                                  }
                                });
                              },
                              onOpen: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (_) => LeadDetailScreen(leadId: l.id),
                                  ),
                                );
                              },
                            );
                          }),
                          if (dash.recentLeads.length > _recentVisible) ...[
                            const SizedBox(height: 4),
                            Center(
                              child: TextButton.icon(
                                onPressed: () => setState(() => _recentVisible += 4),
                                icon: const Icon(Icons.expand_more_rounded, size: 18),
                                label: Text(
                                  'Show more leads (${dash.recentLeads.length - _recentVisible} left)',
                                  style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700),
                                ),
                              ),
                            ),
                          ] else if (dash.recentLeads.length > 4) ...[
                            const SizedBox(height: 4),
                            Center(
                              child: TextButton(
                                onPressed: () => openCrmModule(context, 'leads', title: 'Leads'),
                                child: Text(
                                  'View all leads',
                                  style: GoogleFonts.plusJakartaSans(
                                    fontWeight: FontWeight.w700,
                                    color: EmbTheme.teal,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ],
                        if (dash.todayTasks.isNotEmpty) ...[
                          const SizedBox(height: 22),
                          const _SectionTitle(title: "Today's tasks"),
                          const SizedBox(height: 12),
                          ...dash.todayTasks.take(4).map(_TaskTile.new),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ScaffoldBg extends StatelessWidget {
  const _ScaffoldBg({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: EmbTheme.cream,
      child: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFFFFBF7), EmbTheme.cream, Color(0xFFEEE8DF)],
          ),
        ),
        child: child,
      ),
    );
  }
}

class _HeroBanner extends StatelessWidget {
  const _HeroBanner({
    required this.topPad,
    required this.firstName,
    required this.roleLabel,
    required this.today,
    required this.total,
    required this.newToday,
    required this.hot,
    required this.follow,
    required this.won,
    required this.onNotify,
  });

  final double topPad;
  final String firstName;
  final String roleLabel;
  final String today;
  final int total;
  final int newToday;
  final int hot;
  final int follow;
  final int won;
  final VoidCallback onNotify;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 340 + topPad * 0.2,
      child: Stack(
        fit: StackFit.expand,
        children: [
          Positioned.fill(
            child: Image.network(
              _heroImage,
              fit: BoxFit.cover,
              alignment: const Alignment(0, -0.2),
              errorBuilder: (_, _, _) => Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFF1A6B6A), Color(0xFF0D8B8B), Color(0xFF245B7A)],
                  ),
                ),
              ),
            ),
          ),
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    const Color(0xFF0B2A36).withValues(alpha: 0.55),
                    const Color(0xFF0B2A36).withValues(alpha: 0.35),
                    EmbTheme.cream.withValues(alpha: 0.92),
                    EmbTheme.cream,
                  ],
                  stops: const [0, 0.38, 0.82, 1],
                ),
              ),
            ),
          ),
          Padding(
            padding: EdgeInsets.fromLTRB(20, topPad + 10, 16, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Explore My Bharat',
                            style: GoogleFonts.sora(
                              color: Colors.white,
                              fontSize: 22,
                              fontWeight: FontWeight.w700,
                              height: 1.1,
                              shadows: const [Shadow(blurRadius: 12, color: Colors.black38)],
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            today,
                            style: GoogleFonts.plusJakartaSans(
                              color: Colors.white.withValues(alpha: 0.85),
                              fontSize: 12.5,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Consumer<NotificationHub>(
                      builder: (context, hub, _) {
                        return _GlassIconButton(
                          icon: Icons.notifications_none_rounded,
                          badge: hub.unreadCount,
                          onTap: onNotify,
                        );
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 22),
                Text(
                  'Namaste, $firstName',
                  style: GoogleFonts.sora(
                    color: Colors.white,
                    fontSize: 32,
                    fontWeight: FontWeight.w700,
                    height: 1.05,
                    shadows: const [Shadow(blurRadius: 10, color: Colors.black26)],
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  roleLabel.isEmpty ? 'Your travel desk for today' : '$roleLabel · your travel desk',
                  style: GoogleFonts.plusJakartaSans(
                    color: Colors.white.withValues(alpha: 0.88),
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const Spacer(),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.fromLTRB(18, 16, 18, 16),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.94),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: Colors.white),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.12),
                        blurRadius: 28,
                        offset: const Offset(0, 14),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'PIPELINE',
                              style: GoogleFonts.plusJakartaSans(
                                color: EmbTheme.muted,
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 1.1,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '$total',
                              style: GoogleFonts.sora(
                                color: EmbTheme.ink,
                                fontSize: 42,
                                fontWeight: FontWeight.w700,
                                height: 1,
                              ),
                            ),
                            Text(
                              'active leads',
                              style: GoogleFonts.plusJakartaSans(color: EmbTheme.inkSoft, fontSize: 13),
                            ),
                          ],
                        ),
                      ),
                      Container(width: 1, height: 56, color: EmbTheme.border),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _MiniStat(color: EmbTheme.saffron, label: 'Hot', value: '$hot'),
                            const SizedBox(height: 8),
                            _MiniStat(color: EmbTheme.sky, label: 'Follow', value: '$follow'),
                            const SizedBox(height: 8),
                            _MiniStat(color: EmbTheme.mint, label: 'Won', value: '$won'),
                          ],
                        ),
                      ),
                      if (newToday > 0) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                          decoration: BoxDecoration(
                            color: EmbTheme.mintSoft,
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Column(
                            children: [
                              Text(
                                '+$newToday',
                                style: GoogleFonts.sora(
                                  color: EmbTheme.mint,
                                  fontSize: 20,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              Text(
                                'new',
                                style: GoogleFonts.plusJakartaSans(
                                  color: EmbTheme.mint,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 8),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _GlassIconButton extends StatelessWidget {
  const _GlassIconButton({required this.icon, required this.onTap, this.badge = 0});
  final IconData icon;
  final VoidCallback onTap;
  final int badge;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white.withValues(alpha: 0.2),
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: SizedBox(
          width: 44,
          height: 44,
          child: Stack(
            alignment: Alignment.center,
            children: [
              Icon(icon, color: Colors.white, size: 22),
              if (badge > 0)
                Positioned(
                  top: 8,
                  right: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                    decoration: BoxDecoration(
                      color: EmbTheme.saffron,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    constraints: const BoxConstraints(minWidth: 16),
                    child: Text(
                      badge > 99 ? '99+' : '$badge',
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w800),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MiniStat extends StatelessWidget {
  const _MiniStat({required this.color, required this.label, required this.value});
  final Color color;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(width: 7, height: 7, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 8),
        Text('$label  ', style: GoogleFonts.plusJakartaSans(color: EmbTheme.muted, fontSize: 12)),
        Text(value, style: GoogleFonts.plusJakartaSans(color: EmbTheme.ink, fontWeight: FontWeight.w700, fontSize: 13)),
      ],
    );
  }
}

class _QuickStrip extends StatelessWidget {
  const _QuickStrip({required this.role});
  final String? role;

  @override
  Widget build(BuildContext context) {
    final items = <(IconData, String, Color, Color, VoidCallback)>[
      (
        Icons.people_alt_rounded,
        'Leads',
        EmbTheme.teal,
        EmbTheme.tealSoft,
        () => openCrmModule(context, 'leads', title: 'Leads'),
      ),
      (
        Icons.description_rounded,
        'Quotes',
        EmbTheme.saffron,
        EmbTheme.saffronSoft,
        () => openCrmModule(context, 'quotes', title: 'Quotations'),
      ),
      (
        Icons.event_available_rounded,
        'Follow-ups',
        EmbTheme.sky,
        EmbTheme.skySoft,
        () => openCrmModule(context, 'followups', title: 'Follow-ups'),
      ),
      (
        Icons.grid_view_rounded,
        'Modules',
        EmbTheme.ink,
        const Color(0xFFEDE8E0),
        () => Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => Scaffold(
                  backgroundColor: EmbTheme.cream,
                  appBar: AppBar(title: const Text('All Modules')),
                  body: const MenuScreen(),
                ),
              ),
            ),
      ),
    ];

    return SizedBox(
      height: 92,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: items.length,
        separatorBuilder: (_, _) => const SizedBox(width: 10),
        itemBuilder: (_, i) {
          final item = items[i];
          return Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: BorderRadius.circular(20),
              onTap: item.$5,
              child: Ink(
                width: 86,
                decoration: BoxDecoration(
                  color: EmbTheme.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: EmbTheme.border.withValues(alpha: 0.8)),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(color: item.$4, borderRadius: BorderRadius.circular(14)),
                      child: Icon(item.$1, color: item.$3, size: 20),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      item.$2,
                      style: GoogleFonts.plusJakartaSans(
                        fontWeight: FontWeight.w700,
                        fontSize: 12,
                        color: EmbTheme.ink,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title, this.action, this.actionColor, this.onAction});
  final String title;
  final String? action;
  final Color? actionColor;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            title,
            style: GoogleFonts.sora(
              color: EmbTheme.ink,
              fontSize: 22,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
        if (action != null)
          InkWell(
            onTap: onAction,
            borderRadius: BorderRadius.circular(999),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              child: Text(
                action!,
                style: GoogleFonts.plusJakartaSans(
                  color: actionColor ?? EmbTheme.teal,
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _Metric {
  const _Metric({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    required this.soft,
    required this.onTap,
  });
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final Color soft;
  final VoidCallback onTap;
}

class _MetricRow extends StatelessWidget {
  const _MetricRow({required this.items});
  final List<_Metric> items;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, c) {
        final wide = c.maxWidth > 420;
        if (wide) {
          return Row(
            children: [
              for (var i = 0; i < items.length; i++) ...[
                if (i > 0) const SizedBox(width: 10),
                Expanded(child: _MetricTile(item: items[i])),
              ],
            ],
          );
        }
        return Column(
          children: [
            Row(
              children: [
                Expanded(child: _MetricTile(item: items[0])),
                const SizedBox(width: 10),
                Expanded(child: _MetricTile(item: items[1])),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(child: _MetricTile(item: items[2])),
                const SizedBox(width: 10),
                Expanded(child: _MetricTile(item: items[3])),
              ],
            ),
          ],
        );
      },
    );
  }
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({required this.item});
  final _Metric item;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: EmbTheme.white,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: item.onTap,
        child: Container(
          padding: const EdgeInsets.fromLTRB(14, 14, 14, 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: EmbTheme.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(color: item.soft, borderRadius: BorderRadius.circular(12)),
                child: Icon(item.icon, color: item.color, size: 18),
              ),
              const SizedBox(height: 12),
              Text(
                item.value,
                style: GoogleFonts.sora(
                  color: EmbTheme.ink,
                  fontSize: 28,
                  fontWeight: FontWeight.w700,
                  height: 1,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                item.label,
                style: GoogleFonts.plusJakartaSans(color: EmbTheme.inkSoft, fontSize: 12.5, fontWeight: FontWeight.w500),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RevenueChip extends StatelessWidget {
  const _RevenueChip({required this.amount});
  final num amount;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF0D8B8B), Color(0xFF147A78), Color(0xFF1A5F6E)],
        ),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        children: [
          const Icon(Icons.payments_outlined, color: Colors.white),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Revenue this period',
                  style: GoogleFonts.plusJakartaSans(color: Colors.white70, fontSize: 12),
                ),
                Text(
                  formatMoney(amount),
                  style: GoogleFonts.sora(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w700),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _DeskBriefing extends StatelessWidget {
  const _DeskBriefing({
    required this.firstName,
    required this.total,
    required this.hot,
    required this.follow,
    required this.overdue,
    required this.newToday,
    required this.quotes,
    required this.won,
  });

  final String firstName;
  final int total;
  final int hot;
  final int follow;
  final int overdue;
  final int newToday;
  final int quotes;
  final int won;

  String get _message {
    if (overdue > 0) {
      return '$firstName, $overdue follow-up${overdue == 1 ? '' : 's'} overdue — clear these first.';
    }
    if (newToday > 0) {
      return '$newToday new enquir${newToday == 1 ? 'y' : 'ies'} today across $total active leads.';
    }
    if (hot > 0) {
      return '$hot hot lead${hot == 1 ? '' : 's'} need attention · $follow follow-up${follow == 1 ? '' : 's'} lined up.';
    }
    if (follow > 0) {
      return 'You have $follow follow-up${follow == 1 ? '' : 's'} today · $quotes quote${quotes == 1 ? '' : 's'} in motion.';
    }
    if (won > 0) {
      return 'Pipeline steady — $won converted so far · $total active leads on your desk.';
    }
    return 'Your travel desk is ready. $total active leads in the pipeline.';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
      decoration: BoxDecoration(
        color: EmbTheme.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: EmbTheme.border),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: overdue > 0 ? EmbTheme.saffronSoft : EmbTheme.tealSoft,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              overdue > 0 ? Icons.priority_high_rounded : Icons.wb_sunny_outlined,
              color: overdue > 0 ? EmbTheme.saffron : EmbTheme.teal,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Desk briefing',
                  style: GoogleFonts.plusJakartaSans(
                    color: EmbTheme.muted,
                    fontSize: 11.5,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.4,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _message,
                  style: GoogleFonts.plusJakartaSans(
                    color: EmbTheme.ink,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    height: 1.35,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _AttentionRow extends StatelessWidget {
  const _AttentionRow({
    required this.overdue,
    required this.newToday,
    required this.hot,
    required this.follow,
  });

  final int overdue;
  final int newToday;
  final int hot;
  final int follow;

  @override
  Widget build(BuildContext context) {
    final chips = <_AttentionChipData>[
      if (overdue > 0)
        _AttentionChipData(
          label: 'Overdue',
          value: '$overdue',
          color: EmbTheme.coral,
          soft: const Color(0xFFFDECEC),
          icon: Icons.warning_amber_rounded,
          onTap: () => openCrmModule(context, 'followups', title: 'Follow-ups'),
        ),
      if (newToday > 0)
        _AttentionChipData(
          label: 'New today',
          value: '$newToday',
          color: EmbTheme.mint,
          soft: EmbTheme.mintSoft,
          icon: Icons.fiber_new_rounded,
          onTap: () => openCrmModule(context, 'leads', title: 'Leads'),
        ),
      if (hot > 0)
        _AttentionChipData(
          label: 'Hot',
          value: '$hot',
          color: EmbTheme.saffron,
          soft: EmbTheme.saffronSoft,
          icon: Icons.local_fire_department_rounded,
          onTap: () => openCrmModule(context, 'leads', filter: 'hot', title: 'Hot Leads'),
        ),
      _AttentionChipData(
        label: 'Follow-ups',
        value: '$follow',
        color: EmbTheme.sky,
        soft: EmbTheme.skySoft,
        icon: Icons.event_available_rounded,
        onTap: () => openCrmModule(context, 'followups', title: 'Follow-ups'),
      ),
    ];

    return SizedBox(
      height: 78,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: chips.length,
        separatorBuilder: (_, _) => const SizedBox(width: 10),
        itemBuilder: (_, i) {
          final c = chips[i];
          return Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: c.onTap,
              child: Ink(
                width: 118,
                padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
                decoration: BoxDecoration(
                  color: c.soft,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: c.color.withValues(alpha: 0.18)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(c.icon, size: 16, color: c.color),
                        const Spacer(),
                        Text(
                          c.value,
                          style: GoogleFonts.sora(
                            color: c.color,
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                            height: 1,
                          ),
                        ),
                      ],
                    ),
                    const Spacer(),
                    Text(
                      c.label,
                      style: GoogleFonts.plusJakartaSans(
                        color: EmbTheme.ink,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _AttentionChipData {
  const _AttentionChipData({
    required this.label,
    required this.value,
    required this.color,
    required this.soft,
    required this.icon,
    required this.onTap,
  });
  final String label;
  final String value;
  final Color color;
  final Color soft;
  final IconData icon;
  final VoidCallback onTap;
}

class _EmptyLeads extends StatelessWidget {
  const _EmptyLeads({required this.onAdd});
  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: EmbTheme.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: EmbTheme.border),
      ),
      child: Column(
        children: [
          const Icon(Icons.hiking_rounded, size: 36, color: EmbTheme.teal),
          const SizedBox(height: 10),
          Text('No recent leads yet', style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700, color: EmbTheme.ink)),
          const SizedBox(height: 4),
          Text(
            'New enquiries will show up here',
            style: GoogleFonts.plusJakartaSans(color: EmbTheme.muted, fontSize: 13),
          ),
          const SizedBox(height: 14),
          TextButton(onPressed: onAdd, child: const Text('Browse leads')),
        ],
      ),
    );
  }
}

String _timeAgo(String? iso) {
  if (iso == null || iso.isEmpty) return '';
  final dt = DateTime.tryParse(iso)?.toLocal();
  if (dt == null) return '';
  final diff = DateTime.now().difference(dt);
  if (diff.inMinutes < 1) return 'just now';
  if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
  if (diff.inHours < 24) return '${diff.inHours}h ago';
  if (diff.inDays < 7) return '${diff.inDays}d ago';
  return DateFormat('d MMM').format(dt);
}

class _RecentLeadCard extends StatelessWidget {
  const _RecentLeadCard({
    required this.lead,
    required this.expanded,
    required this.onToggleMore,
    required this.onOpen,
  });

  final Lead lead;
  final bool expanded;
  final VoidCallback onToggleMore;
  final VoidCallback onOpen;

  String get _notes {
    final n = (lead.notes ?? '').trim();
    if (n.isNotEmpty) return n;
    final raw = lead.raw;
    if (raw == null) return '';
    for (final key in ['notes', 'remark', 'remarks', 'comment', 'description']) {
      final v = raw[key]?.toString().trim() ?? '';
      if (v.isNotEmpty) return v;
    }
    return '';
  }

  String get _metaLine {
    final parts = <String>[];
    if ((lead.destination ?? '').isNotEmpty) parts.add(lead.destination!);
    if (lead.budget != null && lead.budget! > 0) parts.add(formatMoney(lead.budget!));
    final adults = lead.adults ?? lead.travelers;
    if (adults != null && adults > 0) {
      final kids = lead.children ?? 0;
      parts.add(kids > 0 ? '${adults}A + ${kids}C' : '$adults pax');
    }
    return parts.join(' · ');
  }

  @override
  Widget build(BuildContext context) {
    final initial = lead.name.isNotEmpty ? lead.name[0].toUpperCase() : '?';
    final notes = _notes;
    final when = _timeAgo(lead.createdAt ?? lead.updatedAt);
    final hasMore = notes.length > 90 ||
        (lead.phone ?? '').isNotEmpty ||
        (lead.source ?? '').isNotEmpty ||
        (lead.assignedToName ?? '').isNotEmpty ||
        (lead.travelDate ?? '').isNotEmpty;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: EmbTheme.white,
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: onOpen,
          child: Container(
            padding: const EdgeInsets.fromLTRB(14, 14, 14, 12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: lead.isHot ? EmbTheme.saffron.withValues(alpha: 0.35) : EmbTheme.border,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    CircleAvatar(
                      radius: 24,
                      backgroundColor: lead.isHot ? EmbTheme.saffronSoft : EmbTheme.tealSoft,
                      child: Text(
                        initial,
                        style: GoogleFonts.sora(
                          fontWeight: FontWeight.w700,
                          fontSize: 18,
                          color: lead.isHot ? EmbTheme.saffron : EmbTheme.teal,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  lead.name,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: GoogleFonts.plusJakartaSans(
                                    fontWeight: FontWeight.w800,
                                    fontSize: 15.5,
                                    color: EmbTheme.ink,
                                  ),
                                ),
                              ),
                              if (lead.isHot)
                                const Padding(
                                  padding: EdgeInsets.only(left: 4),
                                  child: Icon(Icons.local_fire_department, size: 16, color: EmbTheme.saffron),
                                ),
                            ],
                          ),
                          const SizedBox(height: 3),
                          if (_metaLine.isNotEmpty)
                            Text(
                              _metaLine,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.plusJakartaSans(
                                color: EmbTheme.inkSoft,
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          const SizedBox(height: 4),
                          Text(
                            [
                              if ((lead.source ?? '').isNotEmpty) lead.source!,
                              if (when.isNotEmpty) when,
                              if ((lead.assignedToName ?? '').isNotEmpty) lead.assignedToName!,
                            ].join(' · '),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.plusJakartaSans(color: EmbTheme.muted, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    StatusBadge(status: lead.status),
                  ],
                ),
                if (notes.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
                    decoration: BoxDecoration(
                      color: EmbTheme.cream.withValues(alpha: 0.65),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Text(
                      notes,
                      maxLines: expanded ? 12 : 2,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.plusJakartaSans(
                        color: EmbTheme.inkSoft,
                        fontSize: 13,
                        height: 1.4,
                      ),
                    ),
                  ),
                ],
                if (expanded) ...[
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      if ((lead.phone ?? lead.whatsapp ?? '').isNotEmpty)
                        _InfoChip(icon: Icons.phone_outlined, label: lead.phone ?? lead.whatsapp!),
                      if ((lead.email ?? '').isNotEmpty)
                        _InfoChip(icon: Icons.mail_outline, label: lead.email!),
                      if ((lead.travelDate ?? '').isNotEmpty)
                        _InfoChip(icon: Icons.calendar_today_outlined, label: lead.travelDate!),
                      if ((lead.hotelCategory ?? '').isNotEmpty)
                        _InfoChip(icon: Icons.hotel_outlined, label: lead.hotelCategory!),
                      if ((lead.cabType ?? '').isNotEmpty)
                        _InfoChip(icon: Icons.directions_car_outlined, label: lead.cabType!),
                    ],
                  ),
                ],
                const SizedBox(height: 8),
                Row(
                  children: [
                    if (hasMore || notes.length > 90)
                      TextButton(
                        onPressed: onToggleMore,
                        style: TextButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 8),
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          foregroundColor: EmbTheme.teal,
                        ),
                        child: Text(
                          expanded ? 'Show less' : 'Read more',
                          style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w800, fontSize: 13),
                        ),
                      ),
                    const Spacer(),
                    TextButton.icon(
                      onPressed: onOpen,
                      icon: const Icon(Icons.arrow_forward_rounded, size: 16),
                      label: Text(
                        'Open lead',
                        style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700, fontSize: 13),
                      ),
                      style: TextButton.styleFrom(
                        foregroundColor: EmbTheme.ink,
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  const _InfoChip({required this.icon, required this.label});
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: EmbTheme.tealSoft,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: EmbTheme.teal),
          const SizedBox(width: 5),
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 160),
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.plusJakartaSans(
                color: EmbTheme.ink,
                fontSize: 11.5,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _TaskTile extends StatelessWidget {
  const _TaskTile(this.task);
  final Map<String, dynamic> task;

  @override
  Widget build(BuildContext context) {
    final title = (task['title'] ?? task['notes'] ?? task['type'] ?? 'Task').toString();
    final when = (task['scheduledAt'] ?? task['dueAt'] ?? '').toString();
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: EmbTheme.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: EmbTheme.border),
      ),
      child: Row(
        children: [
          const Icon(Icons.check_circle_outline, color: EmbTheme.teal, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(title, style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600, color: EmbTheme.ink)),
          ),
          if (when.isNotEmpty)
            Text(
              DateFormat('h:mm a').format(DateTime.tryParse(when)?.toLocal() ?? DateTime.now()),
              style: GoogleFonts.plusJakartaSans(color: EmbTheme.muted, fontSize: 12),
            ),
        ],
      ),
    );
  }
}
