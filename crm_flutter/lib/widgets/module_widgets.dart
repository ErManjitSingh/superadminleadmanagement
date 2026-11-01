import 'dart:async';

import 'package:flutter/material.dart';

import '../core/api_client.dart';
import '../core/emb_theme.dart';
import '../services/service_utils.dart';
import 'common_widgets.dart' show EmptyState, formatDate, formatMoney;
import 'emb_widgets.dart';

typedef ModuleLoader = Future<List<Json>> Function(String filter, String search);
typedef ModuleItemBuilder = Widget Function(BuildContext context, Json item, Future<void> Function() reload);

/// Reusable native list screen: loading / error / empty / pull-to-refresh,
/// optional filter chips + search, EmbCard-style rows.
class ModuleListScreen extends StatefulWidget {
  const ModuleListScreen({
    super.key,
    required this.title,
    required this.load,
    required this.itemBuilder,
    this.filters = const [],
    this.initialFilter,
    this.searchHint,
    this.emptyMessage = 'Nothing here yet',
    this.emptyIcon = Icons.inbox_outlined,
    this.actions,
    this.floatingActionButton,
    this.header,
  });

  final String title;
  final ModuleLoader load;
  final ModuleItemBuilder itemBuilder;

  /// (value, label) chips. Empty = no chips.
  final List<(String, String)> filters;
  final String? initialFilter;

  /// When non-null a search field is shown and the query is passed to [load].
  final String? searchHint;
  final String emptyMessage;
  final IconData emptyIcon;
  final List<Widget>? actions;
  final Widget? floatingActionButton;

  /// Optional widget shown above the list (e.g. KPI strip).
  final Widget? header;

  @override
  State<ModuleListScreen> createState() => _ModuleListScreenState();
}

class _ModuleListScreenState extends State<ModuleListScreen> {
  final _searchCtrl = TextEditingController();
  Timer? _debounce;
  late String _filter = widget.initialFilter ?? (widget.filters.isEmpty ? '' : widget.filters.first.$1);
  bool _loading = true;
  String? _error;
  List<Json> _items = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final r = await widget.load(_filter, _searchCtrl.text.trim());
      if (!mounted) return;
      setState(() {
        _items = r;
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
    return Scaffold(
      backgroundColor: EmbTheme.cream,
      appBar: embAppBar(widget.title, actions: widget.actions),
      floatingActionButton: widget.floatingActionButton,
      body: Column(
        children: [
          if (widget.searchHint != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 6),
              child: TextField(
                controller: _searchCtrl,
                decoration: embInput(widget.searchHint!, icon: Icons.search),
                onChanged: (_) {
                  _debounce?.cancel();
                  _debounce = Timer(const Duration(milliseconds: 450), _load);
                },
                onSubmitted: (_) => _load(),
              ),
            ),
          if (widget.filters.isNotEmpty)
            SizedBox(
              height: 46,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                children: [
                  for (final f in widget.filters)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: ChoiceChip(
                        label: Text(f.$2),
                        selected: _filter == f.$1,
                        selectedColor: EmbTheme.tealSoft,
                        onSelected: (_) {
                          setState(() => _filter = f.$1);
                          _load();
                        },
                      ),
                    ),
                ],
              ),
            ),
          if (widget.header != null) widget.header!,
          Expanded(
            child: _loading
                ? const EmbLoading()
                : _error != null
                    ? EmbErrorView(message: _error!, onRetry: _load)
                    : RefreshIndicator(
                        color: EmbTheme.teal,
                        onRefresh: _load,
                        child: _items.isEmpty
                            ? ListView(children: [
                                EmptyState(message: widget.emptyMessage, icon: widget.emptyIcon),
                              ])
                            : ListView.builder(
                                physics: const AlwaysScrollableScrollPhysics(),
                                padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                                itemCount: _items.length,
                                itemBuilder: (ctx, i) => widget.itemBuilder(ctx, _items[i], _load),
                              ),
                      ),
          ),
        ],
      ),
    );
  }
}

/// Async-loaded page with pull-to-refresh. [builder] receives loaded data.
class ModuleAsyncPage<T> extends StatefulWidget {
  const ModuleAsyncPage({
    super.key,
    required this.title,
    required this.load,
    required this.builder,
    this.actions,
    this.bottom,
  });

  final String title;
  final Future<T> Function() load;
  final Widget Function(BuildContext context, T data, Future<void> Function() reload) builder;
  final List<Widget>? actions;
  final PreferredSizeWidget? bottom;

  @override
  State<ModuleAsyncPage<T>> createState() => _ModuleAsyncPageState<T>();
}

class _ModuleAsyncPageState<T> extends State<ModuleAsyncPage<T>> {
  bool _loading = true;
  String? _error;
  T? _data;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final d = await widget.load();
      if (!mounted) return;
      setState(() {
        _data = d;
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
    return Scaffold(
      backgroundColor: EmbTheme.cream,
      appBar: embAppBar(widget.title, actions: widget.actions),
      body: _loading
          ? const EmbLoading()
          : _error != null
              ? EmbErrorView(message: _error!, onRetry: _load)
              : RefreshIndicator(
                  color: EmbTheme.teal,
                  onRefresh: _load,
                  child: widget.builder(context, _data as T, _load),
                ),
    );
  }
}

/// Metric tile used by report / payment / attendance dashboards.
class EmbMetric extends StatelessWidget {
  const EmbMetric({super.key, required this.label, required this.value, this.icon, this.color = EmbTheme.teal});
  final String label;
  final String value;
  final IconData? icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: EmbTheme.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: EmbTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          if (icon != null) Icon(icon, color: color, size: 20),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Text(value, style: embBody(size: 22, weight: FontWeight.w800)),
          ),
          Text(label, maxLines: 2, overflow: TextOverflow.ellipsis, style: embBody(size: 12, color: EmbTheme.inkSoft)),
        ],
      ),
    );
  }
}

class EmbMetricGrid extends StatelessWidget {
  const EmbMetricGrid({super.key, required this.children});
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 1.7,
      children: children,
    );
  }
}

/// Navigates to a generic key/value detail page for [data].
Future<T?> openJsonDetail<T>(
  BuildContext context, {
  required String title,
  required Json data,
  Future<Json> Function()? loader,
  List<Widget> Function(BuildContext context, Json data)? actionsBuilder,
}) {
  return Navigator.of(context).push<T>(
    MaterialPageRoute(
      builder: (_) => JsonDetailScreen(title: title, data: data, loader: loader, actionsBuilder: actionsBuilder),
    ),
  );
}

const _hiddenKeys = {
  '__v', 'password', 'passwordHash', 'token', 'companyId', 'branchId', 'tenantId', 'createdBy', 'updatedBy',
};

String humanizeKey(String key) {
  final spaced = key
      .replaceAllMapped(RegExp(r'([a-z0-9])([A-Z])'), (m) => '${m[1]} ${m[2]}')
      .replaceAll('_', ' ')
      .trim();
  if (spaced.isEmpty) return key;
  return '${spaced[0].toUpperCase()}${spaced.substring(1)}';
}

/// Formats an arbitrary JSON value for display, or null if it is not worth showing.
String? displayValue(String key, dynamic v) {
  if (v == null) return null;
  if (v is bool) return v ? 'Yes' : 'No';
  if (v is num) {
    final k = key.toLowerCase();
    final money = ['amount', 'price', 'total', 'paid', 'balance', 'revenue', 'budget', 'cost', 'fee']
        .any(k.contains);
    return money ? formatMoney(v) : (v % 1 == 0 ? v.toInt().toString() : v.toStringAsFixed(2));
  }
  if (v is String) {
    if (v.isEmpty) return null;
    if (RegExp(r'^\d{4}-\d{2}-\d{2}T').hasMatch(v)) return formatDate(v);
    return v;
  }
  if (v is Map) {
    return pickStr(v, ['name', 'title', 'email', 'label', 'bookingNumber', 'quoteNumber']);
  }
  if (v is List) {
    if (v.isEmpty) return null;
    final names = v
        .map((e) => e is Map ? pickStr(e, ['name', 'title', 'label']) : e?.toString())
        .whereType<String>()
        .toList();
    return names.isEmpty ? '${v.length} item(s)' : names.take(6).join(', ');
  }
  return v.toString();
}

class JsonDetailScreen extends StatefulWidget {
  const JsonDetailScreen({
    super.key,
    required this.title,
    required this.data,
    this.loader,
    this.actionsBuilder,
  });

  final String title;
  final Json data;
  final Future<Json> Function()? loader;
  final List<Widget> Function(BuildContext context, Json data)? actionsBuilder;

  @override
  State<JsonDetailScreen> createState() => _JsonDetailScreenState();
}

class _JsonDetailScreenState extends State<JsonDetailScreen> {
  late Json _data = widget.data;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  Future<void> _refresh() async {
    if (widget.loader == null) return;
    setState(() => _loading = true);
    try {
      final d = await widget.loader!();
      if (!mounted) return;
      setState(() => _data = {..._data, ...d});
    } catch (_) {
      // keep list data if detail fetch fails
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final rows = <MapEntry<String, String>>[];
    for (final e in _data.entries) {
      if (_hiddenKeys.contains(e.key)) continue;
      final s = displayValue(e.key, e.value);
      if (s == null) continue;
      rows.add(MapEntry(humanizeKey(e.key == '_id' ? 'id' : e.key), s));
    }
    return Scaffold(
      backgroundColor: EmbTheme.cream,
      appBar: embAppBar(widget.title),
      body: RefreshIndicator(
        color: EmbTheme.teal,
        onRefresh: _refresh,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
          children: [
            if (_loading) const LinearProgressIndicator(color: EmbTheme.teal, minHeight: 2),
            if (widget.actionsBuilder != null) ...widget.actionsBuilder!(context, _data),
            EmbCard(
              child: Column(
                children: [
                  for (var i = 0; i < rows.length; i++) ...[
                    if (i > 0) const Divider(height: 18, color: EmbTheme.border),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SizedBox(
                          width: 118,
                          child: Text(rows[i].key, style: embBody(size: 12, color: EmbTheme.muted)),
                        ),
                        Expanded(child: SelectableText(rows[i].value, style: embBody(size: 14))),
                      ],
                    ),
                  ],
                  if (rows.isEmpty) const EmptyState(message: 'No details available'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Renders a nested map of numeric stats as metric tiles (top-level scalars only).
List<Widget> metricTilesFromMap(Json map, {int max = 12}) {
  final tiles = <Widget>[];
  for (final e in map.entries) {
    if (tiles.length >= max) break;
    if (e.value is num) {
      tiles.add(EmbMetric(
        label: humanizeKey(e.key),
        value: displayValue(e.key, e.value) ?? '0',
        icon: Icons.insights_outlined,
        color: tiles.length.isEven ? EmbTheme.teal : EmbTheme.saffron,
      ));
    }
  }
  return tiles;
}
