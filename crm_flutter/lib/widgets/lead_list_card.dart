import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../core/emb_theme.dart';
import '../core/roles.dart';
import '../models/models.dart';
import 'common_widgets.dart' show formatMoney;
import 'emb_widgets.dart' show embBody, embDisplay;

/// Rich lead row used on Leads tab — destination, budget, source, notes, actions.
class LeadListCard extends StatelessWidget {
  const LeadListCard({
    super.key,
    required this.lead,
    required this.onTap,
    this.expanded = false,
    this.onToggleMore,
  });

  final Lead lead;
  final VoidCallback onTap;
  final bool expanded;
  final VoidCallback? onToggleMore;

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

  String get _timeAgo {
    final iso = lead.createdAt ?? lead.updatedAt;
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

  String get _travelers {
    final adults = lead.adults ?? lead.travelers;
    if (adults == null || adults <= 0) return '';
    final kids = lead.children ?? 0;
    return kids > 0 ? '${adults}A + ${kids}C' : '$adults pax';
  }

  String get _phone => (lead.phone ?? lead.whatsapp ?? '').trim();

  Color get _accent => lead.isHot ? EmbTheme.saffron : EmbTheme.teal;
  Color get _soft => lead.isHot ? EmbTheme.saffronSoft : EmbTheme.tealSoft;

  Future<void> _call() async {
    if (_phone.isEmpty) return;
    await launchUrl(Uri.parse('tel:$_phone'));
  }

  Future<void> _whatsapp() async {
    if (_phone.isEmpty) return;
    final digits = _phone.replaceAll(RegExp(r'[^\d+]'), '');
    await launchUrl(Uri.parse('https://wa.me/$digits'), mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    final initial = lead.name.isNotEmpty ? lead.name[0].toUpperCase() : '?';
    final notes = _notes;
    final meta = <String>[
      if ((lead.destination ?? '').isNotEmpty) lead.destination!,
      if (lead.budget != null && lead.budget! > 0) formatMoney(lead.budget!),
      if (_travelers.isNotEmpty) _travelers,
    ];
    final sub = <String>[
      if ((lead.source ?? '').isNotEmpty) lead.source!,
      if (_timeAgo.isNotEmpty) _timeAgo,
      if ((lead.assignedToName ?? '').isNotEmpty) lead.assignedToName!,
    ];
    final statusColor = Color(leadStatusColor(lead.status));
    final canExpand = onToggleMore != null &&
        (notes.length > 80 ||
            _phone.isNotEmpty ||
            (lead.email ?? '').isNotEmpty ||
            (lead.travelDate ?? '').isNotEmpty ||
            (lead.hotelCategory ?? '').isNotEmpty ||
            (lead.nextFollowUp ?? '').isNotEmpty);

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: EmbTheme.white,
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.fromLTRB(14, 14, 14, 12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: lead.isHot ? EmbTheme.saffron.withValues(alpha: 0.4) : EmbTheme.border,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.03),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: _soft,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        initial,
                        style: embDisplay(size: 20, weight: FontWeight.w700, color: _accent),
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
                                  style: embBody(size: 15.5, weight: FontWeight.w800),
                                ),
                              ),
                              if (lead.isHot)
                                const Padding(
                                  padding: EdgeInsets.only(left: 4),
                                  child: Icon(Icons.local_fire_department_rounded,
                                      size: 16, color: EmbTheme.saffron),
                                ),
                            ],
                          ),
                          if ((lead.leadId ?? '').isNotEmpty) ...[
                            const SizedBox(height: 2),
                            Text(
                              lead.leadId!,
                              style: embBody(size: 11.5, color: EmbTheme.muted, weight: FontWeight.w600),
                            ),
                          ],
                          if (meta.isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Text(
                              meta.join(' · '),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: embBody(size: 13, weight: FontWeight.w600, color: EmbTheme.inkSoft),
                            ),
                          ],
                          if (sub.isNotEmpty) ...[
                            const SizedBox(height: 3),
                            Text(
                              sub.join(' · '),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: embBody(size: 12, color: EmbTheme.muted),
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                      decoration: BoxDecoration(
                        color: statusColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        leadStatusLabel(lead.status),
                        style: GoogleFonts.plusJakartaSans(
                          color: statusColor,
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    if ((lead.destination ?? '').isNotEmpty)
                      _Chip(icon: Icons.place_outlined, label: lead.destination!, color: EmbTheme.teal),
                    if (lead.budget != null && lead.budget! > 0)
                      _Chip(icon: Icons.payments_outlined, label: formatMoney(lead.budget!), color: EmbTheme.mint),
                    if (_travelers.isNotEmpty)
                      _Chip(icon: Icons.group_outlined, label: _travelers, color: EmbTheme.sky),
                    if ((lead.travelDate ?? '').isNotEmpty)
                      _Chip(icon: Icons.calendar_month_outlined, label: lead.travelDate!, color: EmbTheme.saffron),
                  ],
                ),
                if (notes.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF7F3EC),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Text(
                      notes,
                      maxLines: expanded ? 10 : 2,
                      overflow: TextOverflow.ellipsis,
                      style: embBody(size: 13, color: EmbTheme.inkSoft, height: 1.4),
                    ),
                  ),
                ],
                if (expanded) ...[
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      if (_phone.isNotEmpty) _Chip(icon: Icons.phone_outlined, label: _phone, color: EmbTheme.teal),
                      if ((lead.email ?? '').isNotEmpty)
                        _Chip(icon: Icons.mail_outline, label: lead.email!, color: EmbTheme.sky),
                      if ((lead.hotelCategory ?? '').isNotEmpty)
                        _Chip(icon: Icons.hotel_outlined, label: lead.hotelCategory!, color: EmbTheme.saffron),
                      if ((lead.cabType ?? '').isNotEmpty)
                        _Chip(icon: Icons.directions_car_outlined, label: lead.cabType!, color: EmbTheme.inkSoft),
                      if ((lead.nextFollowUp ?? '').isNotEmpty)
                        _Chip(icon: Icons.event_available_outlined, label: 'FU: ${lead.nextFollowUp!}', color: EmbTheme.coral),
                      if ((lead.temperature ?? lead.leadScore ?? '').isNotEmpty)
                        _Chip(
                          icon: Icons.thermostat_outlined,
                          label: (lead.temperature ?? lead.leadScore)!,
                          color: EmbTheme.saffron,
                        ),
                    ],
                  ),
                ],
                const SizedBox(height: 10),
                Row(
                  children: [
                    if (canExpand)
                      TextButton(
                        onPressed: onToggleMore,
                        style: TextButton.styleFrom(
                          foregroundColor: EmbTheme.teal,
                          padding: const EdgeInsets.symmetric(horizontal: 6),
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: Text(
                          expanded ? 'Show less' : 'Read more',
                          style: embBody(size: 13, weight: FontWeight.w800, color: EmbTheme.teal),
                        ),
                      ),
                    const Spacer(),
                    if (_phone.isNotEmpty) ...[
                      _ActionBtn(
                        icon: Icons.call_rounded,
                        color: EmbTheme.mint,
                        soft: EmbTheme.mintSoft,
                        tooltip: 'Call',
                        onTap: _call,
                      ),
                      const SizedBox(width: 8),
                      _ActionBtn(
                        icon: Icons.chat_rounded,
                        color: const Color(0xFF128C7E),
                        soft: const Color(0xFFE7F7F2),
                        tooltip: 'WhatsApp',
                        onTap: _whatsapp,
                      ),
                      const SizedBox(width: 8),
                    ],
                    _ActionBtn(
                      icon: Icons.arrow_forward_rounded,
                      color: EmbTheme.ink,
                      soft: const Color(0xFFEDE8E0),
                      tooltip: 'Open',
                      onTap: onTap,
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

class _Chip extends StatelessWidget {
  const _Chip({required this.icon, required this.label, required this.color});
  final IconData icon;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: color),
          const SizedBox(width: 5),
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 140),
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: embBody(size: 11.5, weight: FontWeight.w700, color: EmbTheme.ink),
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionBtn extends StatelessWidget {
  const _ActionBtn({
    required this.icon,
    required this.color,
    required this.soft,
    required this.onTap,
    required this.tooltip,
  });
  final IconData icon;
  final Color color;
  final Color soft;
  final VoidCallback onTap;
  final String tooltip;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: Material(
        color: soft,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: onTap,
          child: SizedBox(
            width: 38,
            height: 38,
            child: Icon(icon, size: 18, color: color),
          ),
        ),
      ),
    );
  }
}
