import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../core/emb_theme.dart';
import '../services/service_utils.dart';
import '../widgets/emb_widgets.dart';
import '../widgets/module_widgets.dart';
import 'reports_screen.dart' show ReportBody;

/// Native read-only view for any CRM list/summary endpoint
/// (vendors, hotels, audit log, templates, settings…).
/// Lists are shown as cards -> detail page; objects are shown as metrics + sections.
class GenericApiScreen extends StatelessWidget {
  const GenericApiScreen({
    super.key,
    required this.title,
    required this.endpoint,
    this.query,
    this.icon = Icons.list_alt_rounded,
  });

  final String title;
  final String endpoint;
  final Map<String, dynamic>? query;
  final IconData icon;

  static const _titleKeys = [
    'name', 'title', 'subject', 'invoiceNumber', 'bookingNumber', 'action', 'label', 'email', 'type', '_id'
  ];
  static const _subKeys = ['destination', 'location', 'status', 'type', 'email', 'phone', 'category', 'createdAt'];

  @override
  Widget build(BuildContext context) {
    final api = context.read<ApiClient>();
    return ModuleAsyncPage<dynamic>(
      title: title,
      load: () async => (await api.get(endpoint, queryParameters: query)).data,
      builder: (context, data, reload) {
        final rows = asMapList(data, ['logs', 'templates', 'vendors', 'hotels', 'activities', 'tickets', 'leads']);
        if (rows.isNotEmpty) {
          return ListView.builder(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
            itemCount: rows.length,
            itemBuilder: (_, i) {
              final r = rows[i];
              final name = pickStr(r, _titleKeys) ?? 'Item';
              final subs = _subKeys
                  .map((k) => displayValue(k, r[k]))
                  .whereType<String>()
                  .where((s) => s != name)
                  .take(3)
                  .join(' • ');
              return EmbCard(
                onTap: () => openJsonDetail(context, title: name, data: r),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(color: EmbTheme.tealSoft, borderRadius: BorderRadius.circular(12)),
                      child: Icon(icon, color: EmbTheme.teal, size: 20),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(name, style: embBody(size: 15, weight: FontWeight.w700)),
                          if (subs.isNotEmpty)
                            Text(subs, maxLines: 2, overflow: TextOverflow.ellipsis,
                                style: embBody(size: 12, color: EmbTheme.inkSoft)),
                        ],
                      ),
                    ),
                    const Icon(Icons.chevron_right, color: EmbTheme.muted),
                  ],
                ),
              );
            },
          );
        }
        final map = asMap(data);
        if (map.isEmpty) {
          return ListView(children: const [
            Padding(padding: EdgeInsets.all(48), child: Center(child: Text('Nothing to show yet'))),
          ]);
        }
        return ReportBody(data: map);
      },
    );
  }
}
