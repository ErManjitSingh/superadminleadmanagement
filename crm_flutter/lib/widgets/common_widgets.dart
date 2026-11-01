import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../core/roles.dart';
import '../core/theme.dart';
import '../models/models.dart';

class KpiCard extends StatelessWidget {
  const KpiCard({super.key, required this.label, required this.value, this.icon, this.color});

  final String label;
  final String value;
  final IconData? icon;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final c = color ?? AppColors.primary;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (icon != null)
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: c.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: c, size: 18),
            ),
          const SizedBox(height: 10),
          Text(value, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
          const SizedBox(height: 2),
          Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
        ],
      ),
    );
  }
}

class StatusBadge extends StatelessWidget {
  const StatusBadge({super.key, required this.status});
  final String status;

  @override
  Widget build(BuildContext context) {
    final color = Color(leadStatusColor(status));
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        leadStatusLabel(status),
        style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w700),
      ),
    );
  }
}

class LeadCard extends StatelessWidget {
  const LeadCard({super.key, required this.lead, required this.onTap});
  final Lead lead;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      lead.name,
                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                    ),
                  ),
                  if (lead.isHot)
                    const Padding(
                      padding: EdgeInsets.only(right: 6),
                      child: Icon(Icons.local_fire_department, color: AppColors.hot, size: 18),
                    ),
                  StatusBadge(status: lead.status),
                ],
              ),
              const SizedBox(height: 8),
              if (lead.destination != null && lead.destination!.isNotEmpty)
                Row(
                  children: [
                    const Icon(Icons.place_outlined, size: 14, color: AppColors.textMuted),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(lead.destination!, style: const TextStyle(color: AppColors.textSecondary)),
                    ),
                  ],
                ),
              if (lead.phone != null && lead.phone!.isNotEmpty) ...[
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.phone_outlined, size: 14, color: AppColors.textMuted),
                    const SizedBox(width: 4),
                    Text(lead.phone!, style: const TextStyle(color: AppColors.textSecondary)),
                    const Spacer(),
                    IconButton(
                      visualDensity: VisualDensity.compact,
                      onPressed: () => launchUrl(Uri.parse('tel:${lead.phone}')),
                      icon: const Icon(Icons.call, color: AppColors.success, size: 20),
                    ),
                    IconButton(
                      visualDensity: VisualDensity.compact,
                      onPressed: () {
                        final phone = lead.phone!.replaceAll(RegExp(r'[^\d+]'), '');
                        launchUrl(Uri.parse('https://wa.me/$phone'));
                      },
                      icon: const Icon(Icons.chat, color: Color(0xFF25D366), size: 20),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class EmptyState extends StatelessWidget {
  const EmptyState({super.key, required this.message, this.icon = Icons.inbox_outlined});
  final String message;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 48, color: AppColors.textMuted),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.textSecondary)),
          ],
        ),
      ),
    );
  }
}

String formatMoney(num value) {
  return NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0).format(value);
}

String formatDate(String? iso) {
  if (iso == null || iso.isEmpty) return '—';
  final dt = DateTime.tryParse(iso);
  if (dt == null) return iso;
  return DateFormat('dd MMM yyyy, hh:mm a').format(dt.toLocal());
}
