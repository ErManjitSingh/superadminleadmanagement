import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/emb_theme.dart';
import '../services/payments_service.dart';
import '../services/service_utils.dart';
import '../widgets/common_widgets.dart' show formatMoney, formatDate;
import '../widgets/emb_widgets.dart';
import '../widgets/module_widgets.dart';

/// Payments: dashboard KPIs (booking-payments) + invoice/payment list (/payments).
class PaymentsScreen extends StatefulWidget {
  const PaymentsScreen({super.key, this.initialStatus});
  final String? initialStatus;

  @override
  State<PaymentsScreen> createState() => _PaymentsScreenState();
}

class _PaymentsScreenState extends State<PaymentsScreen> {
  Json _stats = {};

  static const _filters = [
    ('', 'All'),
    ('pending', 'Pending'),
    ('partial', 'Partial'),
    ('paid', 'Paid'),
    ('refunded', 'Refunded'),
    ('cancelled', 'Cancelled'),
  ];

  Future<void> _loadStats() async {
    try {
      final s = await context.read<PaymentsService>().fetchDashboard();
      if (mounted) setState(() => _stats = s);
    } catch (_) {
      // dashboard is optional (permission-gated); list still works
    }
  }

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  @override
  Widget build(BuildContext context) {
    final svc = context.read<PaymentsService>();
    final tiles = metricTilesFromMap(_stats, max: 4);
    return ModuleListScreen(
      title: 'Payments',
      searchHint: 'Search invoice or customer',
      filters: _filters,
      initialFilter: widget.initialStatus ?? '',
      emptyMessage: 'No payments found',
      emptyIcon: Icons.payments_outlined,
      header: tiles.isEmpty
          ? null
          : Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 4),
              child: SizedBox(
                height: 76,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  children: [
                    for (final t in tiles) SizedBox(width: 150, child: Padding(padding: const EdgeInsets.only(right: 8), child: t)),
                  ],
                ),
              ),
            ),
      load: (filter, search) async {
        _loadStats();
        return svc.fetchPayments(status: filter, search: search);
      },
      itemBuilder: (context, p, reload) {
        final status = pickStr(p, ['status']);
        final total = pickNum(p, ['totalAmount', 'amount', 'total']);
        final paid = pickNum(p, ['paidAmount']);
        return EmbCard(
          onTap: () => openJsonDetail(
            context,
            title: pickStr(p, ['invoiceNumber']) ?? 'Payment',
            data: p,
            loader: () => svc.fetchPayment(idOf(p)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(pickStr(p, ['customerName']) ?? 'Customer',
                        style: embBody(size: 16, weight: FontWeight.w700)),
                  ),
                  if (status != null) EmbPill(prettyStatus(status), color: statusTone(status == 'paid' ? 'completed' : status)),
                ],
              ),
              const SizedBox(height: 4),
              Text(pickStr(p, ['invoiceNumber']) ?? '', style: embBody(size: 12, color: EmbTheme.muted)),
              const SizedBox(height: 6),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Paid ${formatMoney(paid)} of ${formatMoney(total)}',
                      style: embBody(size: 13, color: EmbTheme.inkSoft),
                    ),
                  ),
                  Text(formatDate(pickStr(p, ['paidAt', 'createdAt'])), style: embBody(size: 11, color: EmbTheme.muted)),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}
