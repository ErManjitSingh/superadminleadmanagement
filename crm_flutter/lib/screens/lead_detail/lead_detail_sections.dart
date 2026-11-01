import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/emb_theme.dart';
import '../../models/models.dart';
import '../../widgets/common_widgets.dart' show StatusBadge, formatMoney;
import '../../widgets/emb_widgets.dart';
import 'lead_detail_utils.dart';

// ---------------------------------------------------------------------------
// Generic building blocks
// ---------------------------------------------------------------------------

/// Titled card (matches the website `Card` with a bold heading).
class LdCard extends StatelessWidget {
  const LdCard({
    super.key,
    required this.title,
    required this.child,
    this.subtitle,
    this.icon,
    this.trailing,
    this.padding = const EdgeInsets.fromLTRB(14, 4, 14, 12),
  });

  final String title;
  final String? subtitle;
  final IconData? icon;
  final Widget? trailing;
  final Widget child;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) {
    return EmbCard(
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 12, 10, 8),
            child: Row(
              children: [
                if (icon != null) ...[
                  Icon(icon, size: 18, color: EmbTheme.teal),
                  const SizedBox(width: 8),
                ],
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: GoogleFonts.sora(fontSize: 16, fontWeight: FontWeight.w700, color: EmbTheme.ink)),
                      if (subtitle != null)
                        Text(subtitle!, style: embBody(size: 11.5, color: EmbTheme.muted)),
                    ],
                  ),
                ),
                if (trailing != null) trailing!,
              ],
            ),
          ),
          const Divider(height: 1, color: EmbTheme.border),
          Padding(padding: padding, child: child),
        ],
      ),
    );
  }
}

class LdInfoRow extends StatelessWidget {
  const LdInfoRow(this.label, this.value, {super.key, this.last = false, this.onTap});
  final String label;
  final String? value;
  final bool last;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final v = (value == null || value!.isEmpty) ? '—' : value!;
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          border: last ? null : const Border(bottom: BorderSide(color: Color(0xFFF1ECE3))),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: embBody(size: 13, color: EmbTheme.muted)),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                v,
                textAlign: TextAlign.right,
                style: embBody(size: 13.5, weight: FontWeight.w600, color: onTap != null ? EmbTheme.teal : EmbTheme.ink),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class LdEmptyLine extends StatelessWidget {
  const LdEmptyLine(this.text, {super.key});
  final String text;
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 14),
        child: Center(child: Text(text, style: embBody(size: 13, color: EmbTheme.muted))),
      );
}

class LdLoadingLine extends StatelessWidget {
  const LdLoadingLine({super.key});
  @override
  Widget build(BuildContext context) => const Padding(
        padding: EdgeInsets.symmetric(vertical: 16),
        child: Center(
          child: SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(strokeWidth: 2, color: EmbTheme.teal),
          ),
        ),
      );
}

class LdErrorLine extends StatelessWidget {
  const LdErrorLine(this.message, {super.key, this.onRetry});
  final String message;
  final VoidCallback? onRetry;
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Row(
          children: [
            const Icon(Icons.info_outline, size: 18, color: EmbTheme.muted),
            const SizedBox(width: 8),
            Expanded(child: Text(message, style: embBody(size: 12.5, color: EmbTheme.inkSoft))),
            if (onRetry != null) TextButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      );
}

// ---------------------------------------------------------------------------
// 1. Header
// ---------------------------------------------------------------------------

class LdHeader extends StatelessWidget {
  const LdHeader({super.key, required this.lead, required this.scores});
  final Lead lead;
  final LeadScores scores;

  @override
  Widget build(BuildContext context) {
    final converted = lead.status == 'converted';
    final route = [lead.pickup, lead.drop].where((e) => e != null && e.isNotEmpty).join(' → ');
    final tempColor = temperatureColor(lead);
    return EmbCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 60,
                height: 60,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    colors: converted
                        ? const [EmbTheme.mint, EmbTheme.teal]
                        : const [EmbTheme.teal, Color(0xFF0A6B78)],
                  ),
                ),
                child: Text(
                  initialsOf(lead.name),
                  style: GoogleFonts.plusJakartaSans(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Wrap(
                      spacing: 8,
                      runSpacing: 4,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        Text(
                          lead.name,
                          style: GoogleFonts.sora(fontSize: 21, fontWeight: FontWeight.w700, color: EmbTheme.ink),
                        ),
                        if (lead.isHot) const Icon(Icons.local_fire_department, color: EmbTheme.coral, size: 20),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      [
                        formatLeadCode(lead),
                        if (lead.destination != null && lead.destination!.isNotEmpty) lead.destination!,
                        'Lead 360',
                      ].join(' · '),
                      style: embBody(size: 12.5, color: EmbTheme.muted),
                    ),
                    const SizedBox(height: 8),
                    StatusBadge(status: lead.status),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          if (lead.phone != null && lead.phone!.isNotEmpty)
            _contactLine(Icons.phone_outlined, lead.phone!, () => launchUrl(Uri.parse('tel:${lead.phone}'))),
          if (lead.email != null && lead.email!.isNotEmpty)
            _contactLine(Icons.mail_outline, lead.email!, () => launchUrl(Uri.parse('mailto:${lead.email}'))),
          _contactLine(
            Icons.place_outlined,
            route.isNotEmpty ? route : (lead.destination ?? '—'),
            null,
          ),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: EmbTheme.cream,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: EmbTheme.border),
            ),
            child: Column(
              children: [
                _metric('Lead Score', '${scores.overall}/100', valueColor: EmbTheme.mint),
                _metric(
                  'Lead Temperature',
                  temperatureLabel(lead),
                  valueColor: tempColor,
                  leading: Icon(Icons.local_fire_department, size: 15, color: tempColor),
                ),
                _metric('Source', sourceLabel(lead)),
                _metric('Created On', fmtDay(lead.createdAt)),
                _metric(
                  'Assigned To',
                  lead.assignedToName ?? 'Unassigned',
                  last: true,
                  valueColor: lead.assignedToName == null ? EmbTheme.muted : EmbTheme.ink,
                  leading: lead.assignedToName == null
                      ? null
                      : CircleAvatar(
                          radius: 11,
                          backgroundColor: EmbTheme.tealSoft,
                          child: Text(
                            initialsOf(lead.assignedToName),
                            style: GoogleFonts.plusJakartaSans(fontSize: 9, fontWeight: FontWeight.w800, color: EmbTheme.teal),
                          ),
                        ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _contactLine(IconData icon, String text, VoidCallback? onTap) => InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 5),
          child: Row(
            children: [
              Icon(icon, size: 17, color: EmbTheme.teal),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  text,
                  overflow: TextOverflow.ellipsis,
                  style: embBody(size: 14, color: onTap != null ? EmbTheme.ink : EmbTheme.inkSoft),
                ),
              ),
            ],
          ),
        ),
      );

  Widget _metric(String label, String value, {Color? valueColor, Widget? leading, bool last = false}) => Container(
        padding: const EdgeInsets.symmetric(vertical: 9),
        decoration: BoxDecoration(
          border: last ? null : const Border(bottom: BorderSide(color: EmbTheme.border)),
        ),
        child: Row(
          children: [
            Text(label, style: embBody(size: 13, color: EmbTheme.muted)),
            const Spacer(),
            if (leading != null) ...[leading, const SizedBox(width: 6)],
            Flexible(
              child: Text(
                value,
                overflow: TextOverflow.ellipsis,
                style: embBody(size: 13.5, weight: FontWeight.w700, color: valueColor),
              ),
            ),
          ],
        ),
      );
}

// ---------------------------------------------------------------------------
// 2. Pipeline
// ---------------------------------------------------------------------------

class LdPipeline extends StatelessWidget {
  const LdPipeline({super.key, required this.status, this.onStageTap});
  final String status;
  final void Function(String stage)? onStageTap;

  @override
  Widget build(BuildContext context) {
    final stages = leadPipelineStages;
    final currentIdx = stages.indexWhere((s) => s.key == status);
    final isLost = status == 'lost';
    return LdCard(
      title: 'Lead Pipeline',
      icon: Icons.timeline,
      padding: const EdgeInsets.fromLTRB(8, 12, 8, 12),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            for (var i = 0; i < stages.length; i++) ...[
              _stage(stages[i], i, currentIdx, isLost),
              if (i < stages.length - 1)
                Container(
                  width: 14,
                  height: 2,
                  margin: const EdgeInsets.only(top: 15),
                  color: currentIdx >= 0 && i < currentIdx ? EmbTheme.teal : EmbTheme.border,
                ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _stage(MapEntry<String, String> stage, int i, int currentIdx, bool isLost) {
    final active = stage.key == status;
    final done = currentIdx >= 0 && i <= currentIdx && !isLost && stage.key != 'lost';
    final isConverted = active && stage.key == 'converted';
    final isNegative = active && (stage.key == 'lost' || stage.key == 'booked_from_another_company');
    Color fill = Colors.white;
    Color border = EmbTheme.border;
    Widget? inner;
    if (isConverted) {
      fill = EmbTheme.mint;
      border = EmbTheme.mint;
      inner = const Icon(Icons.emoji_events, size: 16, color: Colors.white);
    } else if (isNegative) {
      fill = EmbTheme.danger;
      border = EmbTheme.danger;
      inner = const Icon(Icons.close, size: 16, color: Colors.white);
    } else if (active) {
      fill = EmbTheme.teal;
      border = EmbTheme.teal;
      inner = const Icon(Icons.check, size: 16, color: Colors.white);
    } else if (done) {
      fill = EmbTheme.tealSoft;
      border = EmbTheme.teal.withValues(alpha: 0.5);
      inner = const Icon(Icons.check, size: 14, color: EmbTheme.teal);
    }
    return InkWell(
      borderRadius: BorderRadius.circular(10),
      onTap: onStageTap == null ? null : () => onStageTap!(stage.key),
      child: SizedBox(
        width: 74,
        child: Column(
          children: [
            Container(
              width: 32,
              height: 32,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: fill,
                border: Border.all(color: border, width: 2),
                boxShadow: active
                    ? [BoxShadow(color: border.withValues(alpha: 0.35), blurRadius: 8, offset: const Offset(0, 2))]
                    : null,
              ),
              child: inner,
            ),
            const SizedBox(height: 6),
            Text(
              stage.value,
              textAlign: TextAlign.center,
              style: embBody(
                size: 10.5,
                weight: active ? FontWeight.w800 : FontWeight.w600,
                color: active ? (isNegative ? EmbTheme.danger : EmbTheme.teal) : (done ? EmbTheme.inkSoft : EmbTheme.muted),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// 3. Converted banner
// ---------------------------------------------------------------------------

class LdConvertedBanner extends StatelessWidget {
  const LdConvertedBanner({super.key, required this.loading, this.booking, this.advance});
  final bool loading;
  final Map<String, dynamic>? booking;
  final Map<String, dynamic>? advance;

  num _n(dynamic v) => v is num ? v : (num.tryParse('${v ?? ''}') ?? 0);

  @override
  Widget build(BuildContext context) {
    final remaining = _n(booking?['remainingBalance'] ?? booking?['pendingAmount']);
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: EmbTheme.mintSoft,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: EmbTheme.mint.withValues(alpha: 0.4)),
      ),
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(9),
                decoration: BoxDecoration(color: EmbTheme.mint, borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.emoji_events, color: Colors.white, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Converted! This lead has been successfully converted into a booking.',
                  style: embBody(size: 14, weight: FontWeight.w800, color: const Color(0xFF0F6B4C)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          if (loading)
            Text('Loading booking details…', style: embBody(size: 12, color: EmbTheme.inkSoft))
          else if (booking != null) ...[
            Wrap(
              runSpacing: 10,
              children: [
                _cell('Booking ID', '${booking!['bookingNumber'] ?? '—'}', mono: true),
                _cell('Advance', formatMoney(_n(booking!['advanceReceived']))),
                _cell('Remaining', formatMoney(remaining), color: EmbTheme.saffron),
                _cell('Travel', fmtDay(booking!['travelDate']?.toString())),
                if (booking!['totalAmount'] != null) _cell('Total', formatMoney(_n(booking!['totalAmount']))),
                if (booking!['status'] != null) _cell('Status', titleCase(booking!['status'].toString())),
              ],
            ),
            if (advance != null) ...[
              const SizedBox(height: 10),
              Text(
                'Advance receipt ${advance!['receiptNumber'] ?? ''} · ${formatMoney(_n(advance!['amount']))} · ${titleCase(advance!['mode']?.toString())}',
                style: embBody(size: 12.5, weight: FontWeight.w600, color: EmbTheme.inkSoft),
              ),
              Text(
                (advance!['whatsappSentAt'] != null || advance!['emailSentAt'] != null)
                    ? 'Sent to client${advance!['whatsappSentAt'] != null ? ' · WhatsApp ${fmtDateTime(advance!['whatsappSentAt'].toString())}' : ''}${advance!['emailSentAt'] != null ? ' · Email ${fmtDateTime(advance!['emailSentAt'].toString())}' : ''}'
                    : 'Voucher generated — not yet sent to client.',
                style: embBody(size: 11.5, color: EmbTheme.muted),
              ),
            ],
          ] else
            Text(
              'Booking is being processed. Pull to refresh if details do not appear.',
              style: embBody(size: 12, color: EmbTheme.inkSoft),
            ),
        ],
      ),
    );
  }

  Widget _cell(String label, String value, {bool mono = false, Color? color}) => SizedBox(
        width: 150,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label.toUpperCase(), style: embBody(size: 10, weight: FontWeight.w700, color: EmbTheme.muted)),
            const SizedBox(height: 2),
            Text(
              value,
              style: mono
                  ? GoogleFonts.robotoMono(fontSize: 13, fontWeight: FontWeight.w700, color: EmbTheme.ink)
                  : embBody(size: 14, weight: FontWeight.w700, color: color ?? EmbTheme.ink),
            ),
          ],
        ),
      );
}

// ---------------------------------------------------------------------------
// 4. Contact action row
// ---------------------------------------------------------------------------

class LdContactActions extends StatelessWidget {
  const LdContactActions({
    super.key,
    required this.hasPhone,
    required this.hasEmail,
    required this.onCall,
    required this.onWhatsApp,
    required this.onEmail,
    required this.onQuote,
    required this.onFollowUp,
    required this.onStatus,
  });

  final bool hasPhone;
  final bool hasEmail;
  final VoidCallback onCall;
  final VoidCallback onWhatsApp;
  final VoidCallback onEmail;
  final VoidCallback onQuote;
  final VoidCallback onFollowUp;
  final VoidCallback? onStatus;

  @override
  Widget build(BuildContext context) {
    return EmbCard(
      padding: const EdgeInsets.all(12),
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        children: [
          _btn('Call', Icons.call, const Color(0xFF16A34A), hasPhone ? onCall : null),
          _btn('WhatsApp', Icons.chat, const Color(0xFF25D366), hasPhone ? onWhatsApp : null),
          _btn('Send Email', Icons.mail_outline, const Color(0xFF166534), hasEmail ? onEmail : null),
          _btn('Create Quotation', Icons.description_outlined, EmbTheme.teal, onQuote),
          _btn('Schedule Follow-up', Icons.event_available_outlined, EmbTheme.saffron, onFollowUp),
          if (onStatus != null) _btn('Change Status', Icons.swap_horiz, EmbTheme.inkSoft, onStatus, outlined: true),
        ],
      ),
    );
  }

  Widget _btn(String label, IconData icon, Color color, VoidCallback? onTap, {bool outlined = false}) {
    final enabled = onTap != null;
    return Material(
      color: outlined ? Colors.white : (enabled ? color : color.withValues(alpha: 0.35)),
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Container(
          height: 42,
          padding: const EdgeInsets.symmetric(horizontal: 14),
          decoration: outlined
              ? BoxDecoration(borderRadius: BorderRadius.circular(12), border: Border.all(color: EmbTheme.border))
              : null,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 17, color: outlined ? color : Colors.white),
              const SizedBox(width: 7),
              Text(
                label,
                style: embBody(size: 13.5, weight: FontWeight.w700, color: outlined ? EmbTheme.ink : Colors.white),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Floating footer quick actions (thumb-reach dock)
// ---------------------------------------------------------------------------

class LdFloatingQuickBar extends StatelessWidget {
  const LdFloatingQuickBar({
    super.key,
    required this.hasPhone,
    required this.hasEmail,
    required this.onCall,
    required this.onWhatsApp,
    required this.onEmail,
    required this.onQuote,
    required this.onFollowUp,
    required this.onCallNote,
    this.onStatus,
    this.onConvert,
  });

  final bool hasPhone;
  final bool hasEmail;
  final VoidCallback onCall;
  final VoidCallback onWhatsApp;
  final VoidCallback onEmail;
  final VoidCallback onQuote;
  final VoidCallback onFollowUp;
  final VoidCallback onCallNote;
  final VoidCallback? onStatus;
  final VoidCallback? onConvert;

  @override
  Widget build(BuildContext context) {
    final items = <({String tip, IconData icon, Color color, VoidCallback? onTap})>[
      (tip: 'Call', icon: Icons.call, color: const Color(0xFF16A34A), onTap: hasPhone ? onCall : null),
      (tip: 'WhatsApp', icon: Icons.chat, color: const Color(0xFF25D366), onTap: hasPhone ? onWhatsApp : null),
      (tip: 'Email', icon: Icons.mail_outline, color: const Color(0xFF166534), onTap: hasEmail ? onEmail : null),
      (tip: 'Quotation', icon: Icons.description_outlined, color: EmbTheme.teal, onTap: onQuote),
      (tip: 'Follow-up', icon: Icons.event_available_outlined, color: EmbTheme.saffron, onTap: onFollowUp),
      (tip: 'Call note', icon: Icons.phone_in_talk_outlined, color: EmbTheme.sky, onTap: onCallNote),
      if (onStatus != null)
        (tip: 'Status', icon: Icons.swap_horiz, color: EmbTheme.inkSoft, onTap: onStatus),
      if (onConvert != null)
        (tip: 'Convert', icon: Icons.auto_awesome, color: EmbTheme.teal, onTap: onConvert),
    ];

    return Material(
      elevation: 10,
      shadowColor: EmbTheme.ink.withValues(alpha: 0.22),
      color: EmbTheme.white,
      borderRadius: BorderRadius.circular(28),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(28),
          border: Border.all(color: EmbTheme.border),
        ),
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              for (final item in items)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 3),
                  child: _FabIcon(
                    tip: item.tip,
                    icon: item.icon,
                    color: item.color,
                    onTap: item.onTap,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FabIcon extends StatelessWidget {
  const _FabIcon({
    required this.tip,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  final String tip;
  final IconData icon;
  final Color color;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final enabled = onTap != null;
    return Tooltip(
      message: tip,
      child: Material(
        color: enabled ? color.withValues(alpha: 0.14) : EmbTheme.cream,
        shape: const CircleBorder(),
        child: InkWell(
          customBorder: const CircleBorder(),
          onTap: onTap,
          child: SizedBox(
            width: 46,
            height: 46,
            child: Icon(icon, size: 22, color: enabled ? color : EmbTheme.muted.withValues(alpha: 0.45)),
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// 5/6. Customer overview + Travel information
// ---------------------------------------------------------------------------

class LdCustomerOverview extends StatelessWidget {
  const LdCustomerOverview({super.key, required this.lead});
  final Lead lead;

  @override
  Widget build(BuildContext context) {
    return LdCard(
      title: 'Customer Overview',
      icon: Icons.person_outline,
      child: Column(
        children: [
          LdInfoRow('Full Name', lead.name),
          LdInfoRow('Phone', lead.phone, onTap: lead.phone == null || lead.phone!.isEmpty ? null : () => launchUrl(Uri.parse('tel:${lead.phone}'))),
          if (lead.whatsapp != null && lead.whatsapp != lead.phone) LdInfoRow('WhatsApp', lead.whatsapp),
          LdInfoRow('Email', lead.email, onTap: lead.email == null || lead.email!.isEmpty ? null : () => launchUrl(Uri.parse('mailto:${lead.email}'))),
          LdInfoRow('Pickup', lead.pickup),
          LdInfoRow('Drop', lead.drop),
          LdInfoRow('Cab Type', lead.cabType),
          LdInfoRow('Lead Age', leadAge(lead.createdAt)),
          LdInfoRow('Last Contacted', fmtDay(lead.lastContactedAt)),
          LdInfoRow('Lead Owner', lead.assignedToName ?? 'Unassigned', last: true),
        ],
      ),
    );
  }
}

class LdTravelInfo extends StatelessWidget {
  const LdTravelInfo({super.key, required this.lead});
  final Lead lead;

  @override
  Widget build(BuildContext context) {
    final children = lead.children ?? 0;
    final adults = lead.adults ?? math.max(1, (lead.travelers ?? 2) - children);
    final pkgType = (lead.leadType != null && lead.leadType!.isNotEmpty)
        ? titleCase(lead.leadType)
        : (lead.hotelCategory ?? '—');
    return LdCard(
      title: 'Travel Information',
      icon: Icons.flight_takeoff,
      child: Column(
        children: [
          LdInfoRow('Destination', lead.destination),
          LdInfoRow('Travel Date', fmtDay(lead.travelDate)),
          LdInfoRow('Adults', '$adults'),
          LdInfoRow('Children', '$children'),
          LdInfoRow('Budget', (lead.budget ?? 0) > 0 ? formatMoney(lead.budget!) : '—'),
          LdInfoRow('Source', sourceLabel(lead)),
          LdInfoRow('Package Type', pkgType),
          if (lead.hotelCategory != null && lead.hotelCategory!.isNotEmpty)
            LdInfoRow('Hotel Category', lead.hotelCategory),
          if (lead.statusReason != null && lead.statusReason!.isNotEmpty)
            LdInfoRow('Status Reason', lead.statusReason, last: true),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// 7. Activity timeline
// ---------------------------------------------------------------------------

class LdTimeline extends StatefulWidget {
  const LdTimeline({
    super.key,
    required this.activities,
    required this.loading,
    this.error,
    this.onOpenQuote,
    this.onRetry,
  });

  final List<Map<String, dynamic>> activities;
  final bool loading;
  final String? error;
  final void Function(String quoteId)? onOpenQuote;
  final VoidCallback? onRetry;

  @override
  State<LdTimeline> createState() => _LdTimelineState();
}

class _LdTimelineState extends State<LdTimeline> {
  bool _showAll = false;
  static const _collapsed = 8;

  @override
  Widget build(BuildContext context) {
    final items = widget.activities;
    final visible = _showAll ? items : items.take(_collapsed).toList();
    return LdCard(
      title: 'Activity Timeline',
      subtitle: items.isEmpty ? null : '${items.length} activities',
      icon: Icons.history,
      child: widget.loading && items.isEmpty
          ? const LdLoadingLine()
          : Column(
              children: [
                if (widget.error != null)
                  LdErrorLine('Timeline unavailable: ${widget.error}', onRetry: widget.onRetry),
                if (items.isEmpty && widget.error == null) const LdEmptyLine('No activity yet'),
                for (var i = 0; i < visible.length; i++) _row(visible[i], i == visible.length - 1),
                if (items.length > _collapsed)
                  TextButton(
                    onPressed: () => setState(() => _showAll = !_showAll),
                    child: Text(_showAll ? 'Show less' : 'Show all ${items.length}'),
                  ),
              ],
            ),
    );
  }

  Widget _row(Map<String, dynamic> a, bool last) {
    final type = a['type']?.toString();
    final style = activityStyle(type);
    final title = (a['title']?.toString().isNotEmpty ?? false) ? a['title'].toString() : style.label;
    final notes = (a['notes'] ?? a['description'])?.toString() ?? '';
    final user = a['user']?.toString() ?? '';
    final meta = a['meta'] is Map ? a['meta'] as Map : const {};
    final quoteId = meta['quotationId']?.toString();
    final tappable = quoteId != null && quoteId.isNotEmpty && widget.onOpenQuote != null;
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            width: 36,
            child: Column(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(color: style.color.withValues(alpha: 0.12), shape: BoxShape.circle),
                  child: Icon(style.icon, size: 16, color: style.color),
                ),
                if (!last) Expanded(child: Container(width: 2, color: EmbTheme.border)),
              ],
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: InkWell(
              onTap: tappable ? () => widget.onOpenQuote!(quoteId) : null,
              child: Padding(
                padding: const EdgeInsets.only(bottom: 14, top: 2),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(child: Text(title, style: embBody(size: 14, weight: FontWeight.w700))),
                        if (tappable) const Icon(Icons.chevron_right, size: 18, color: EmbTheme.muted),
                      ],
                    ),
                    if (notes.isNotEmpty && notes != title)
                      Padding(
                        padding: const EdgeInsets.only(top: 2),
                        child: Text(notes, style: embBody(size: 12.5, weight: FontWeight.w500, color: EmbTheme.inkSoft)),
                      ),
                    const SizedBox(height: 3),
                    Text(
                      [if (user.isNotEmpty) user, fmtDateTime(a['date']?.toString())].join(' · '),
                      style: embBody(size: 11, color: EmbTheme.muted),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// 8. Quick actions
// ---------------------------------------------------------------------------

class LdQuickActions extends StatelessWidget {
  const LdQuickActions({
    super.key,
    required this.onCallNote,
    required this.onAssign,
    required this.onEdit,
    required this.onConvert,
    required this.onStatus,
    required this.onReactivate,
  });

  final VoidCallback onCallNote;
  final VoidCallback? onAssign;
  final VoidCallback? onEdit;
  final VoidCallback? onConvert;
  final VoidCallback? onStatus;
  final VoidCallback? onReactivate;

  @override
  Widget build(BuildContext context) {
    return LdCard(
      title: 'Quick Actions',
      icon: Icons.flash_on_outlined,
      padding: const EdgeInsets.all(12),
      child: Column(
        children: [
          _tile(Icons.phone_in_talk_outlined, 'Log Call Note', const Color(0xFF15803D), const Color(0xFFE8F7EE), onCallNote),
          if (onAssign != null)
            _tile(Icons.how_to_reg_outlined, 'Assign Lead', EmbTheme.sky, EmbTheme.skySoft, onAssign!),
          if (onEdit != null)
            _tile(Icons.edit_outlined, 'Edit Lead', const Color(0xFF6D4FD0), const Color(0xFFF0EBFC), onEdit!),
          if (onConvert != null)
            _tile(Icons.auto_awesome, 'Convert Lead', Colors.white, EmbTheme.teal, onConvert!, bold: true),
          if (onReactivate != null)
            _tile(Icons.refresh, 'Reactivate Lead', EmbTheme.teal, EmbTheme.tealSoft, onReactivate!),
          if (onStatus != null)
            _tile(Icons.swap_horiz, 'Change Status', EmbTheme.saffron, EmbTheme.saffronSoft, onStatus!),
        ],
      ),
    );
  }

  Widget _tile(IconData icon, String label, Color fg, Color bg, VoidCallback onTap, {bool bold = false}) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Material(
          color: bg,
          borderRadius: BorderRadius.circular(12),
          child: InkWell(
            borderRadius: BorderRadius.circular(12),
            onTap: onTap,
            child: Container(
              height: 46,
              padding: const EdgeInsets.symmetric(horizontal: 14),
              child: Row(
                children: [
                  Icon(icon, size: 19, color: fg),
                  const SizedBox(width: 10),
                  Text(label, style: embBody(size: 14, weight: bold ? FontWeight.w800 : FontWeight.w700, color: fg)),
                ],
              ),
            ),
          ),
        ),
      );
}

// ---------------------------------------------------------------------------
// 9. Notes
// ---------------------------------------------------------------------------

class LdNotes extends StatefulWidget {
  const LdNotes({
    super.key,
    required this.notes,
    required this.legacyNote,
    required this.loading,
    required this.onAdd,
    this.error,
  });

  final List<Map<String, dynamic>> notes;
  final String? legacyNote;
  final bool loading;
  final String? error;
  final Future<void> Function(String text) onAdd;

  @override
  State<LdNotes> createState() => _LdNotesState();
}

class _LdNotesState extends State<LdNotes> {
  final _ctrl = TextEditingController();
  bool _busy = false;

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final text = _ctrl.text.trim();
    if (text.isEmpty || _busy) return;
    setState(() => _busy = true);
    try {
      await widget.onAdd(text);
      _ctrl.clear();
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final items = widget.notes;
    final legacy = widget.legacyNote;
    return LdCard(
      title: 'Lead Notes',
      subtitle: items.isEmpty ? null : '${items.length} notes',
      icon: Icons.sticky_note_2_outlined,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (widget.loading && items.isEmpty)
            const LdLoadingLine()
          else if (items.isEmpty && (legacy == null || legacy.isEmpty))
            LdEmptyLine(widget.error != null ? 'Notes unavailable' : 'No notes yet')
          else ...[
            if (items.isEmpty && legacy != null && legacy.isNotEmpty) _note(legacy, null, null),
            for (final n in items)
              _note(
                (n['message'] ?? n['text'] ?? n['content'] ?? '').toString(),
                n['user'] is Map ? (n['user'] as Map)['name']?.toString() : n['user']?.toString(),
                (n['date'] ?? n['createdAt'])?.toString(),
              ),
          ],
          const SizedBox(height: 6),
          TextField(
            controller: _ctrl,
            minLines: 1,
            maxLines: 4,
            textCapitalization: TextCapitalization.sentences,
            decoration: embInput('Add a quick note…').copyWith(
              suffixIcon: _busy
                  ? const Padding(
                      padding: EdgeInsets.all(12),
                      child: SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)),
                    )
                  : IconButton(
                      onPressed: _submit,
                      icon: const Icon(Icons.send_rounded, color: EmbTheme.teal),
                    ),
            ),
            onSubmitted: (_) => _submit(),
          ),
        ],
      ),
    );
  }

  Widget _note(String text, String? user, String? date) => Container(
        width: double.infinity,
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFFFFF8E7),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFF6E3B0)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(text, style: embBody(size: 13.5, weight: FontWeight.w500, color: EmbTheme.ink)),
            if ((user != null && user.isNotEmpty) || date != null)
              Padding(
                padding: const EdgeInsets.only(top: 5),
                child: Text(
                  [if (user != null && user.isNotEmpty) user, if (date != null) fmtDateTime(date)].join(' · '),
                  style: embBody(size: 11, weight: FontWeight.w600, color: const Color(0xFFB07A1A)),
                ),
              ),
          ],
        ),
      );
}

// ---------------------------------------------------------------------------
// 10. Upcoming follow-ups
// ---------------------------------------------------------------------------

class LdFollowups extends StatelessWidget {
  const LdFollowups({
    super.key,
    required this.followups,
    required this.nextFollowUp,
    required this.loading,
    required this.onSchedule,
  });

  final List<FollowUp> followups;
  final String? nextFollowUp;
  final bool loading;
  final VoidCallback onSchedule;

  @override
  Widget build(BuildContext context) {
    final next = upcomingFollowUp(followups);
    final sorted = [...followups]..sort((a, b) => b.scheduledAt.compareTo(a.scheduledAt));
    final others = sorted.where((f) => f.id != next?.id).take(6).toList();
    return LdCard(
      title: 'Upcoming Follow-up',
      icon: Icons.event_outlined,
      trailing: TextButton.icon(
        onPressed: onSchedule,
        icon: const Icon(Icons.add, size: 16),
        label: const Text('Add'),
      ),
      child: loading && followups.isEmpty
          ? const LdLoadingLine()
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (next != null)
                  _highlight(fmtDateTime(next.scheduledAt), subtitle: _fuMeta(next), badge: 'Upcoming')
                else if (nextFollowUp != null && nextFollowUp!.isNotEmpty)
                  _highlight(fmtDateTime(nextFollowUp), badge: 'Upcoming')
                else
                  const LdEmptyLine('No upcoming follow-up'),
                if (others.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text('ALL FOLLOW-UPS', style: embBody(size: 10.5, weight: FontWeight.w800, color: EmbTheme.muted)),
                  const SizedBox(height: 4),
                  for (final f in others)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 5),
                      child: Row(
                        children: [
                          Icon(
                            f.status == 'completed' ? Icons.check_circle : Icons.schedule,
                            size: 16,
                            color: f.status == 'completed' ? EmbTheme.mint : EmbTheme.muted,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              '${fmtDateTime(f.scheduledAt)} · ${_fuMeta(f)}',
                              style: embBody(size: 12.5, color: EmbTheme.inkSoft),
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ],
            ),
    );
  }

  String _fuMeta(FollowUp f) => [
        titleCase(f.type ?? 'call'),
        if (f.status != null) titleCase(f.status),
        if (f.notes != null && f.notes!.isNotEmpty) f.notes!,
      ].join(' · ');

  Widget _highlight(String when, {String? subtitle, required String badge}) => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: EmbTheme.tealSoft,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: EmbTheme.teal.withValues(alpha: 0.25)),
        ),
        child: Row(
          children: [
            const Icon(Icons.event, size: 18, color: EmbTheme.teal),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(when, style: embBody(size: 14, weight: FontWeight.w700, color: EmbTheme.teal)),
                  if (subtitle != null && subtitle.isNotEmpty)
                    Text(subtitle, style: embBody(size: 12, color: EmbTheme.inkSoft)),
                ],
              ),
            ),
            EmbPill(badge),
          ],
        ),
      );
}

// ---------------------------------------------------------------------------
// 11. Tags
// ---------------------------------------------------------------------------

class LdTags extends StatelessWidget {
  const LdTags({super.key, required this.tags});
  final List<String> tags;

  @override
  Widget build(BuildContext context) {
    return LdCard(
      title: 'Tags',
      icon: Icons.sell_outlined,
      child: tags.isEmpty
          ? const LdEmptyLine('No tags')
          : Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [for (final t in tags) EmbPill(t, color: const Color(0xFF6D4FD0))],
              ),
            ),
    );
  }
}

// ---------------------------------------------------------------------------
// 12. Quotations
// ---------------------------------------------------------------------------

class LdQuotations extends StatelessWidget {
  const LdQuotations({
    super.key,
    required this.quotations,
    required this.loading,
    required this.onOpen,
    required this.onCreate,
    this.onShare,
    this.onPreview,
    this.sharingQuoteId,
    this.error,
  });

  final List<Quotation> quotations;
  final bool loading;
  final String? error;
  final void Function(Quotation q) onOpen;
  final VoidCallback onCreate;
  final void Function(Quotation q)? onShare;
  final void Function(Quotation q)? onPreview;
  final String? sharingQuoteId;

  @override
  Widget build(BuildContext context) {
    return LdCard(
      title: 'Recent Quotations',
      subtitle: quotations.isEmpty ? null : '${quotations.length} quotation${quotations.length == 1 ? '' : 's'}',
      icon: Icons.description_outlined,
      trailing: TextButton.icon(
        onPressed: onCreate,
        icon: const Icon(Icons.add, size: 16),
        label: const Text('New'),
      ),
      padding: const EdgeInsets.fromLTRB(10, 6, 10, 10),
      child: loading && quotations.isEmpty
          ? const LdLoadingLine()
          : quotations.isEmpty
              ? Column(
                  children: [
                    LdEmptyLine(error != null ? 'Quotations unavailable' : 'No quotations yet'),
                    OutlinedButton.icon(
                      onPressed: onCreate,
                      icon: const Icon(Icons.add),
                      label: const Text('Create Quotation'),
                    ),
                  ],
                )
              : Column(
                  children: [
                    for (final q in quotations) ...[
                      ListTile(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 6),
                        onTap: () => onOpen(q),
                        leading: Container(
                          width: 38,
                          height: 38,
                          decoration: BoxDecoration(
                            color: statusTone(q.status).withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(Icons.description_outlined, color: statusTone(q.status), size: 20),
                        ),
                        title: Text(
                          q.quoteNumber ?? 'Quotation',
                          style: embBody(size: 14, weight: FontWeight.w800),
                        ),
                        subtitle: Text(
                          '${q.packageName} · ${fmtDay(q.createdAt)}',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: embBody(size: 12, color: EmbTheme.muted),
                        ),
                        trailing: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(formatMoney(q.total), style: embBody(size: 13.5, weight: FontWeight.w800)),
                            const SizedBox(height: 3),
                            EmbPill(prettyStatus(q.status ?? 'draft'), color: statusTone(q.status)),
                          ],
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(50, 0, 6, 10),
                        child: Row(
                          children: [
                            if (onShare != null)
                              Expanded(
                                child: OutlinedButton.icon(
                                  onPressed: sharingQuoteId == q.id ? null : () => onShare!(q),
                                  icon: sharingQuoteId == q.id
                                      ? const SizedBox(
                                          width: 14,
                                          height: 14,
                                          child: CircularProgressIndicator(strokeWidth: 2),
                                        )
                                      : const Icon(Icons.chat, size: 16, color: Color(0xFF25D366)),
                                  label: Text(
                                    sharingQuoteId == q.id ? 'Sharing…' : 'Share',
                                    style: embBody(size: 12, weight: FontWeight.w700),
                                  ),
                                  style: OutlinedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(vertical: 8),
                                    visualDensity: VisualDensity.compact,
                                  ),
                                ),
                              ),
                            if (onShare != null && onPreview != null) const SizedBox(width: 8),
                            if (onPreview != null)
                              Expanded(
                                child: OutlinedButton.icon(
                                  onPressed: () => onPreview!(q),
                                  icon: const Icon(Icons.picture_as_pdf_outlined, size: 16),
                                  label: Text('Preview', style: embBody(size: 12, weight: FontWeight.w700)),
                                  style: OutlinedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(vertical: 8),
                                    visualDensity: VisualDensity.compact,
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
    );
  }
}

// ---------------------------------------------------------------------------
// 13. Score breakdown
// ---------------------------------------------------------------------------

class LdScoreBreakdown extends StatelessWidget {
  const LdScoreBreakdown({super.key, required this.lead, required this.scores});
  final Lead lead;
  final LeadScores scores;

  @override
  Widget build(BuildContext context) {
    return LdCard(
      title: 'Lead Score Breakdown',
      icon: Icons.donut_large_outlined,
      padding: const EdgeInsets.fromLTRB(10, 14, 10, 14),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _Ring(label: 'Overall Score', value: scores.overall, color: EmbTheme.teal),
              _Ring(label: 'Budget Score', value: scores.budget, color: const Color(0xFF22C55E)),
              _Ring(label: 'Engagement', value: scores.engagement, color: EmbTheme.sky),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _Ring(label: 'Response Score', value: scores.response, color: const Color(0xFF8B5CF6)),
              _Ring(label: 'Conversion Prob.', value: scores.conversion, color: EmbTheme.saffron, suffix: '%'),
              _Ring(
                label: 'Temperature',
                value: lead.isHot || lead.temperature == 'hot' ? 100 : (lead.temperature == 'warm' ? 60 : 30),
                color: temperatureColor(lead),
                text: temperatureLabel(lead),
              ),
            ],
          ),
          if (lead.leadScore != null && lead.leadScore!.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              'Lead grade: ${titleCase(lead.leadScore)}',
              style: embBody(size: 12.5, weight: FontWeight.w700, color: EmbTheme.inkSoft),
            ),
          ],
        ],
      ),
    );
  }
}

class _Ring extends StatelessWidget {
  const _Ring({required this.label, required this.value, required this.color, this.suffix = '', this.text});
  final String label;
  final int value;
  final Color color;
  final String suffix;
  final String? text;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 96,
      child: Column(
        children: [
          SizedBox(
            width: 76,
            height: 76,
            child: CustomPaint(
              painter: _RingPainter(value / 100, color),
              child: Center(
                child: Text(
                  text ?? '$value$suffix',
                  style: embBody(size: text != null ? 12.5 : 17, weight: FontWeight.w800),
                ),
              ),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            textAlign: TextAlign.center,
            style: embBody(size: 11, weight: FontWeight.w600, color: EmbTheme.muted),
          ),
        ],
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  _RingPainter(this.fraction, this.color);
  final double fraction;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    const stroke = 7.0;
    final rect = Rect.fromLTWH(stroke / 2, stroke / 2, size.width - stroke, size.height - stroke);
    final bg = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..color = const Color(0xFFEFE9DE);
    final fg = Paint()
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeWidth = stroke
      ..color = color;
    canvas.drawArc(rect, 0, math.pi * 2, false, bg);
    canvas.drawArc(rect, -math.pi / 2, math.pi * 2 * fraction.clamp(0.0, 1.0), false, fg);
  }

  @override
  bool shouldRepaint(covariant _RingPainter old) => old.fraction != fraction || old.color != color;
}

// ---------------------------------------------------------------------------
// 14. Email history
// ---------------------------------------------------------------------------

class LdEmailHistory extends StatelessWidget {
  const LdEmailHistory({super.key, required this.rows, required this.loading, this.error, this.onRetry});
  final List<Map<String, dynamic>> rows;
  final bool loading;
  final String? error;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return LdCard(
      title: 'Email History',
      subtitle: 'Sent emails and customer replies',
      icon: Icons.mail_outline,
      child: loading && rows.isEmpty
          ? const LdLoadingLine()
          : rows.isEmpty
              ? (error != null
                  ? LdErrorLine('Email history not available for your role', onRetry: onRetry)
                  : const LdEmptyLine('No emails yet'))
              : Column(
                  children: [
                    for (final r in rows)
                      _row(r),
                  ],
                ),
    );
  }

  Widget _row(Map<String, dynamic> r) {
    final inbound = r['direction'] == 'inbound';
    final to = r['to'];
    final toText = to is List ? to.join(', ') : (to?.toString() ?? '');
    final who = inbound ? (r['fromName'] ?? r['fromEmail'] ?? 'Customer').toString() : toText;
    final status = (r['status'] ?? '').toString();
    final replies = r['replies'] is List ? (r['replies'] as List).whereType<Map>().toList() : const <Map>[];
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(7),
            decoration: BoxDecoration(
              color: (inbound ? EmbTheme.mint : EmbTheme.sky).withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(inbound ? Icons.call_received : Icons.call_made, size: 16, color: inbound ? EmbTheme.mint : EmbTheme.sky),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  (r['subject'] ?? '(no subject)').toString(),
                  style: embBody(size: 13.5, weight: FontWeight.w700),
                ),
                Text(
                  '${inbound ? 'From' : 'To'}: $who',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: embBody(size: 12, color: EmbTheme.inkSoft),
                ),
                if (inbound && r['snippet'] != null)
                  Text(r['snippet'].toString(), maxLines: 2, overflow: TextOverflow.ellipsis, style: embBody(size: 12, color: EmbTheme.muted)),
                Text(
                  [
                    if (r['sentBy'] != null) r['sentBy'].toString(),
                    fmtDateTime(r['sentAt']?.toString()),
                  ].join(' · '),
                  style: embBody(size: 11, color: EmbTheme.muted),
                ),
                for (final rep in replies)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      '↩ Reply from ${rep['fromName'] ?? rep['fromEmail'] ?? 'customer'} · ${fmtDateTime(rep['receivedAt']?.toString())}',
                      style: embBody(size: 11.5, color: EmbTheme.mint, weight: FontWeight.w600),
                    ),
                  ),
              ],
            ),
          ),
          if (status.isNotEmpty) EmbPill(prettyStatus(status), color: statusTone(status == 'failed' ? 'rejected' : status)),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// 15. Transfer history
// ---------------------------------------------------------------------------

class LdTransferHistory extends StatelessWidget {
  const LdTransferHistory({super.key, required this.rows, required this.loading, this.error, this.onRetry});
  final List<Map<String, dynamic>> rows;
  final bool loading;
  final String? error;
  final VoidCallback? onRetry;

  static const _labels = {
    'assign': 'Assigned',
    'reassign': 'Reassigned',
    'bulk_assign': 'Bulk Assigned',
    'branch_transfer': 'Branch Transfer',
  };

  String _name(dynamic v, String fallback) {
    if (v is Map) return (v['name'] ?? v['code'] ?? fallback).toString();
    return fallback;
  }

  @override
  Widget build(BuildContext context) {
    return LdCard(
      title: 'Transfer History',
      subtitle: 'Assignment and branch transfers',
      icon: Icons.swap_horiz,
      child: loading && rows.isEmpty
          ? const LdLoadingLine()
          : rows.isEmpty
              ? (error != null
                  ? LdErrorLine('Transfer history unavailable', onRetry: onRetry)
                  : const LdEmptyLine('No transfers recorded yet'))
              : Column(
                  children: [
                    for (final r in rows)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(7),
                              decoration: BoxDecoration(color: EmbTheme.cream, borderRadius: BorderRadius.circular(10)),
                              child: Icon(
                                r['type'] == 'branch_transfer' ? Icons.business : Icons.how_to_reg_outlined,
                                size: 16,
                                color: EmbTheme.inkSoft,
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    _labels[r['type']] ?? titleCase(r['type']?.toString()),
                                    style: embBody(size: 13.5, weight: FontWeight.w700),
                                  ),
                                  Text(
                                    r['type'] == 'branch_transfer'
                                        ? '${_name(r['fromBranchId'], 'Previous branch')} → ${_name(r['toBranchId'], 'New branch')}'
                                        : '${_name(r['fromUserId'], 'Unassigned')} → ${_name(r['toUserId'], '—')}',
                                    style: embBody(size: 12.5, color: EmbTheme.inkSoft),
                                  ),
                                  Text(
                                    '${r['actorName'] ?? _name(r['actorId'], 'System')} · ${fmtDateTime(r['createdAt']?.toString())}',
                                    style: embBody(size: 11, color: EmbTheme.muted),
                                  ),
                                ],
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

// ---------------------------------------------------------------------------
// 16. Audit trail
// ---------------------------------------------------------------------------

class LdAudit extends StatelessWidget {
  const LdAudit({super.key, required this.rows, required this.loading, this.error, this.onRetry});
  final List<Map<String, dynamic>> rows;
  final bool loading;
  final String? error;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return LdCard(
      title: 'Audit Trail',
      subtitle: 'Field-level change history',
      icon: Icons.shield_outlined,
      child: loading && rows.isEmpty
          ? const LdLoadingLine()
          : rows.isEmpty
              ? (error != null
                  ? LdErrorLine('Audit trail unavailable', onRetry: onRetry)
                  : const LdEmptyLine('No audit entries'))
              : Column(
                  children: [
                    for (final r in rows)
                      Container(
                        width: double.infinity,
                        margin: const EdgeInsets.only(top: 10),
                        padding: const EdgeInsets.only(left: 10),
                        decoration: const BoxDecoration(
                          border: Border(left: BorderSide(color: EmbTheme.teal, width: 2)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              titleCase((r['action'] ?? 'change').toString().replaceAll('.', ' ')),
                              style: embBody(size: 13.5, weight: FontWeight.w700),
                            ),
                            for (final c in ((r['changes'] is List ? r['changes'] as List : const []).whereType<Map>().take(3)))
                              Text(
                                '${c['field']}: ${c['oldValue'] ?? '—'} → ${c['newValue'] ?? '—'}',
                                style: embBody(size: 12, color: EmbTheme.inkSoft),
                              ),
                            Text(
                              '${r['actorName'] ?? 'System'} · ${fmtDateTime(r['createdAt']?.toString())}',
                              style: embBody(size: 11, color: EmbTheme.muted),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
    );
  }
}
