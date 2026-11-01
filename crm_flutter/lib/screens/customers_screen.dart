import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../core/emb_theme.dart';
import '../models/models.dart';
import '../providers/auth_provider.dart';
import '../services/leads_service.dart';
import '../widgets/common_widgets.dart' show formatMoney, EmptyState;
import '../widgets/emb_widgets.dart';
import 'lead_detail_screen.dart';

/// Customers = leads with status "converted".
class CustomersScreen extends StatefulWidget {
  const CustomersScreen({super.key});

  @override
  State<CustomersScreen> createState() => _CustomersScreenState();
}

class _CustomersScreenState extends State<CustomersScreen> {
  bool loading = true;
  String? error;
  List<Lead> customers = [];
  String query = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final role = context.read<AuthProvider>().user?.role ?? 'sales_executive';
    setState(() {
      loading = true;
      error = null;
    });
    try {
      final r = await context.read<LeadsService>().fetchLeads(role, filter: 'converted', limit: 100);
      if (!mounted) return;
      setState(() {
        customers = r.items;
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

  @override
  Widget build(BuildContext context) {
    final q = query.toLowerCase();
    final shown = customers
        .where((c) =>
            q.isEmpty ||
            c.name.toLowerCase().contains(q) ||
            (c.phone ?? '').contains(q) ||
            (c.destination ?? '').toLowerCase().contains(q))
        .toList();

    return Scaffold(
      backgroundColor: EmbTheme.cream,
      appBar: embAppBar('Customers'),
      body: loading
          ? const EmbLoading()
          : error != null
              ? EmbErrorView(message: error!, onRetry: _load)
              : Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 10, 16, 6),
                      child: TextField(
                        decoration: embInput('Search customers', icon: Icons.search),
                        onChanged: (v) => setState(() => query = v.trim()),
                      ),
                    ),
                    Expanded(
                      child: RefreshIndicator(
                        color: EmbTheme.teal,
                        onRefresh: _load,
                        child: shown.isEmpty
                            ? ListView(children: const [EmptyState(message: 'No customers yet')])
                            : ListView.builder(
                                padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                                itemCount: shown.length,
                                itemBuilder: (_, i) {
                                  final c = shown[i];
                                  return EmbCard(
                                    onTap: () => Navigator.of(context).push(
                                      MaterialPageRoute(builder: (_) => LeadDetailScreen(leadId: c.id)),
                                    ),
                                    child: Row(
                                      children: [
                                        CircleAvatar(
                                          backgroundColor: EmbTheme.mintSoft,
                                          child: Text(
                                            c.name.isEmpty ? '?' : c.name[0].toUpperCase(),
                                            style: embBody(weight: FontWeight.w800, color: EmbTheme.mint),
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(c.name, style: embBody(size: 15, weight: FontWeight.w700)),
                                              Text(
                                                [c.destination, c.phone]
                                                    .where((e) => e != null && e.isNotEmpty)
                                                    .join(' • '),
                                                style: embBody(size: 12, color: EmbTheme.inkSoft),
                                              ),
                                            ],
                                          ),
                                        ),
                                        if (c.budget != null)
                                          Text(formatMoney(c.budget!),
                                              style: embBody(size: 13, weight: FontWeight.w700)),
                                      ],
                                    ),
                                  );
                                },
                              ),
                      ),
                    ),
                  ],
                ),
    );
  }
}
