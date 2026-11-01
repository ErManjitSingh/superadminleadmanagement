import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../core/emb_theme.dart';
import '../services/packages_service.dart';
import '../services/service_utils.dart';
import '../widgets/common_widgets.dart' show formatMoney;
import '../widgets/emb_widgets.dart';
import '../widgets/module_widgets.dart';

class PackagesScreen extends StatefulWidget {
  const PackagesScreen({super.key, this.initialStatus});
  final String? initialStatus;

  @override
  State<PackagesScreen> createState() => _PackagesScreenState();
}

class _PackagesScreenState extends State<PackagesScreen> {
  int _refreshKey = 0;

  static const _filters = [
    ('', 'All'),
    ('published', 'Published'),
    ('draft', 'Draft'),
    ('hidden', 'Hidden'),
    ('archived', 'Archived'),
  ];

  Future<void> _create() async {
    final name = TextEditingController();
    final dest = TextEditingController();
    final days = TextEditingController(text: '3');
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('New package', style: embBody(size: 18, weight: FontWeight.w700)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: name, decoration: embInput('Package name')),
              const SizedBox(height: 10),
              TextField(controller: dest, decoration: embInput('Destination')),
              const SizedBox(height: 10),
              TextField(
                controller: days,
                keyboardType: TextInputType.number,
                decoration: embInput('Duration (days)'),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: EmbTheme.teal),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Create'),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    if (name.text.trim().isEmpty || dest.text.trim().isEmpty) {
      embSnack(context, 'Name and destination are required', error: true);
      return;
    }
    try {
      final d = int.tryParse(days.text.trim()) ?? 1;
      await context.read<PackagesService>().createPackage({
        'name': name.text.trim(),
        'destination': dest.text.trim(),
        'duration': d < 1 ? 1 : d,
        'days': d,
        'nights': d > 1 ? d - 1 : 0,
        'status': 'draft',
      });
      if (!mounted) return;
      embSnack(context, 'Package created');
      setState(() => _refreshKey++);
    } catch (e) {
      if (mounted) embSnack(context, apiErrorMessage(e), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final svc = context.read<PackagesService>();
    return ModuleListScreen(
      key: ValueKey(_refreshKey),
      title: 'Packages',
      searchHint: 'Search packages',
      filters: _filters,
      initialFilter: widget.initialStatus ?? '',
      emptyMessage: 'No packages found',
      emptyIcon: Icons.card_travel,
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: EmbTheme.teal,
        foregroundColor: Colors.white,
        onPressed: _create,
        icon: const Icon(Icons.add),
        label: const Text('New package'),
      ),
      load: (filter, search) => svc.fetchPackages(search: search, status: filter),
      itemBuilder: (context, p, reload) {
        final status = pickStr(p, ['status']);
        final price = pickNum(p, ['price', 'basePrice', 'startingPrice', 'sellingPrice', 'totalPrice']);
        final days = pickNum(p, ['days', 'duration']).toInt();
        final nights = pickNum(p, ['nights']).toInt();
        return EmbCard(
          onTap: () async {
            await openJsonDetail(
              context,
              title: pickStr(p, ['name']) ?? 'Package',
              data: p,
              loader: () => svc.fetchPackage(idOf(p)),
              actionsBuilder: (ctx, data) => [
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _act(ctx, () => svc.publish(idOf(p)), 'Published'),
                        icon: const Icon(Icons.publish, size: 18),
                        label: const Text('Publish'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _act(ctx, () => svc.duplicate(idOf(p)), 'Duplicated'),
                        icon: const Icon(Icons.copy, size: 18),
                        label: const Text('Duplicate'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _act(ctx, () => svc.archive(idOf(p)), 'Archived'),
                        icon: const Icon(Icons.archive_outlined, size: 18),
                        label: const Text('Archive'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
              ],
            );
            reload();
          },
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(pickStr(p, ['name']) ?? 'Package',
                        style: embBody(size: 16, weight: FontWeight.w700)),
                  ),
                  if (status != null) EmbPill(prettyStatus(status), color: _tone(status)),
                ],
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  const Icon(Icons.place_outlined, size: 14, color: EmbTheme.muted),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(pickStr(p, ['destination']) ?? '—',
                        style: embBody(size: 13, color: EmbTheme.inkSoft)),
                  ),
                  if (price > 0) Text(formatMoney(price), style: embBody(size: 13, weight: FontWeight.w700)),
                ],
              ),
              const SizedBox(height: 2),
              Text(
                [
                  if (days > 0) '${nights}N/${days}D',
                  if (pickStr(p, ['packageType']) != null) prettyStatus(pickStr(p, ['packageType'])),
                ].join(' • '),
                style: embBody(size: 12, color: EmbTheme.muted),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _act(BuildContext ctx, Future<void> Function() fn, String done) async {
    try {
      await fn();
      if (ctx.mounted) {
        embSnack(ctx, done);
        Navigator.of(ctx).pop();
      }
    } catch (e) {
      if (ctx.mounted) embSnack(ctx, apiErrorMessage(e), error: true);
    }
  }

  Color _tone(String s) {
    switch (s) {
      case 'published':
        return EmbTheme.mint;
      case 'draft':
        return EmbTheme.saffron;
      case 'archived':
        return EmbTheme.muted;
      default:
        return EmbTheme.sky;
    }
  }
}
