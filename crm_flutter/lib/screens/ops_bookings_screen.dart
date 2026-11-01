import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../core/emb_theme.dart';
import '../models/models.dart';
import '../services/operations_service.dart';
import '../widgets/common_widgets.dart' show formatMoney, formatDate, EmptyState;
import '../widgets/emb_widgets.dart';
import 'ops_booking_detail_screen.dart';

const _filters = [
  ('', 'All'),
  ('pending', 'Pending'),
  ('confirmed', 'Confirmed'),
  ('active', 'Active'),
  ('completed', 'Completed'),
];

class OpsBookingsScreen extends StatefulWidget {
  const OpsBookingsScreen({super.key, this.initialStatus = ''});
  final String initialStatus;

  @override
  State<OpsBookingsScreen> createState() => _OpsBookingsScreenState();
}

class _OpsBookingsScreenState extends State<OpsBookingsScreen> {
  final _scroll = ScrollController();
  final _searchCtrl = TextEditingController();
  Timer? _debounce;
  late String _status = widget.initialStatus;
  String _search = '';
  List<OpsBooking> _items = [];
  int _page = 1;
  int _total = 0;
  bool _loading = true;
  bool _loadingMore = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _scroll.addListener(() {
      if (_scroll.position.pixels > _scroll.position.maxScrollExtent - 300) _loadMore();
    });
    _load();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _scroll.dispose();
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final r = await context
          .read<OperationsService>()
          .fetchOpsBookings(page: 1, status: _status, search: _search);
      if (!mounted) return;
      setState(() {
        _items = r.items;
        _total = r.total;
        _page = 1;
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

  Future<void> _loadMore() async {
    if (_loadingMore || _loading || _items.length >= _total) return;
    setState(() => _loadingMore = true);
    try {
      final r = await context
          .read<OperationsService>()
          .fetchOpsBookings(page: _page + 1, status: _status, search: _search);
      if (!mounted) return;
      setState(() {
        _items = [..._items, ...r.items];
        _page += 1;
        _loadingMore = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loadingMore = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: EmbTheme.cream,
      appBar: embAppBar('Bookings'),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 6),
            child: TextField(
              controller: _searchCtrl,
              decoration: embInput('Search bookings', icon: Icons.search),
              onChanged: (v) {
                _debounce?.cancel();
                _debounce = Timer(const Duration(milliseconds: 400), () {
                  _search = v.trim();
                  _load();
                });
              },
            ),
          ),
          SizedBox(
            height: 44,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              children: [
                for (final f in _filters)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: ChoiceChip(
                      label: Text(f.$2),
                      selected: _status == f.$1,
                      selectedColor: EmbTheme.tealSoft,
                      onSelected: (_) {
                        _status = f.$1;
                        _load();
                      },
                    ),
                  ),
              ],
            ),
          ),
          Expanded(
            child: _loading
                ? const EmbLoading()
                : _error != null
                    ? EmbErrorView(message: _error!, onRetry: _load)
                    : RefreshIndicator(
                        color: EmbTheme.teal,
                        onRefresh: _load,
                        child: _items.isEmpty
                            ? ListView(children: const [EmptyState(message: 'No bookings found')])
                            : ListView.builder(
                                controller: _scroll,
                                physics: const AlwaysScrollableScrollPhysics(),
                                // Extra bottom space so cards clear the floating shell nav.
                                padding: const EdgeInsets.fromLTRB(16, 8, 16, 110),
                                itemCount: _items.length + (_loadingMore ? 1 : 0),
                                itemBuilder: (_, i) {
                                  if (i >= _items.length) {
                                    return const Padding(
                                      padding: EdgeInsets.all(16),
                                      child: Center(child: CircularProgressIndicator(color: EmbTheme.teal)),
                                    );
                                  }
                                  return _tile(_items[i]);
                                },
                              ),
                      ),
          ),
        ],
      ),
    );
  }

  void _openBooking(OpsBooking b) {
    final id = b.id.trim();
    if (id.isEmpty) {
      embSnack(context, 'Booking id missing — pull to refresh', error: true);
      return;
    }
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => OpsBookingDetailScreen(bookingId: id)),
    );
  }

  Widget _tile(OpsBooking b) {
    final tone = statusTone(b.status);
    return EmbCard(
      onTap: () => _openBooking(b),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(b.customerName ?? 'Guest', style: embBody(size: 16, weight: FontWeight.w700)),
              ),
              EmbPill(prettyStatus(b.status), color: tone),
            ],
          ),
          const SizedBox(height: 4),
          Text(b.bookingNumber ?? '', style: embBody(size: 12, color: EmbTheme.muted)),
          const SizedBox(height: 6),
          Row(
            children: [
              const Icon(Icons.place_outlined, size: 14, color: EmbTheme.muted),
              const SizedBox(width: 4),
              Expanded(
                child: Text(b.destination ?? b.packageName ?? '—',
                    style: embBody(size: 13, color: EmbTheme.inkSoft)),
              ),
              Text(formatMoney(b.totalAmount), style: embBody(size: 13, weight: FontWeight.w700)),
            ],
          ),
          const SizedBox(height: 2),
          Text('Travel: ${formatDate(b.travelDate)}', style: embBody(size: 12, color: EmbTheme.inkSoft)),
        ],
      ),
    );
  }
}
