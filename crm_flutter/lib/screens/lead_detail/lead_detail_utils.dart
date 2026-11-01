import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../core/emb_theme.dart';
import '../../models/models.dart';

/// Pipeline stages shown on the Lead 360 page (same order as the website).
const leadPipelineStages = <MapEntry<String, String>>[
  MapEntry('new', 'New Lead'),
  MapEntry('contacted', 'Contacted'),
  MapEntry('working_progress', 'Working Progress'),
  MapEntry('follow_up', 'Follow Up'),
  MapEntry('quotation_sent', 'Quotation Sent'),
  MapEntry('negotiation', 'Negotiation'),
  MapEntry('reactivated', 'Reactivated'),
  MapEntry('converted', 'Converted'),
  MapEntry('lost', 'Lost'),
  MapEntry('booked_from_another_company', 'Booked Elsewhere'),
];

const lockedLeadStatuses = {'converted', 'lost', 'booked_from_another_company'};
const convertEligibleStatuses = {
  'new',
  'contacted',
  'working_progress',
  'follow_up',
  'quotation_sent',
  'negotiation',
  'reactivated',
};
const reasonRequiredStatuses = {'lost', 'booked_from_another_company'};

bool isLeadLocked(String status) => lockedLeadStatuses.contains(status);
bool canConvertStatus(String status) => !isLeadLocked(status);

const callOutcomes = <MapEntry<String, String>>[
  MapEntry('interested', 'Interested'),
  MapEntry('need_better_hotel', 'Needs better hotel'),
  MapEntry('budget_issue', 'Budget issue'),
  MapEntry('call_back_tomorrow', 'Call back tomorrow'),
  MapEntry('not_interested', 'Not interested'),
  MapEntry('no_answer', 'No answer'),
  MapEntry('other', 'Other'),
];

String initialsOf(String? name) {
  final parts = (name ?? '').trim().split(RegExp(r'\s+')).where((e) => e.isNotEmpty).toList();
  if (parts.isEmpty) return 'LD';
  final s = parts.take(2).map((e) => e[0]).join();
  return s.toUpperCase();
}

/// Mirrors the website `formatLeadId` (LD-0000).
String formatLeadCode(Lead lead) {
  final src = lead.leadId ?? lead.id;
  final digits = src.replaceAll(RegExp(r'\D'), '');
  if (lead.leadId != null && lead.leadId!.isNotEmpty && RegExp(r'[A-Za-z]').hasMatch(lead.leadId!)) {
    return lead.leadId!;
  }
  final tail = digits.length > 4 ? digits.substring(digits.length - 4) : digits.padLeft(4, '0');
  return 'LD-$tail';
}

DateTime? parseDate(String? iso) => iso == null || iso.isEmpty ? null : DateTime.tryParse(iso)?.toLocal();

String fmtDay(String? iso) {
  final d = parseDate(iso);
  if (d == null) return '—';
  return DateFormat('d MMM yyyy').format(d);
}

String fmtDateTime(String? iso) {
  final d = parseDate(iso);
  if (d == null) return '—';
  return DateFormat('d MMM yyyy, hh:mm a').format(d);
}

String leadAge(String? createdAt) {
  final d = parseDate(createdAt);
  if (d == null) return '—';
  final days = DateTime.now().difference(d).inDays;
  if (days <= 0) return 'Today';
  if (days == 1) return '1 day';
  return '$days days';
}

String sourceLabel(Lead lead) {
  final raw = (lead.raw?['sourceLabel'] ?? lead.raw?['leadSource'] ?? lead.source ?? '').toString();
  if (raw.isEmpty) return 'Website';
  const labels = {
    'website': 'Website',
    'whatsapp': 'WhatsApp',
    'referral': 'Referral',
    'walk-in': 'Walk-in',
    'social': 'Social',
    'phone': 'Phone',
    'other': 'Other',
    'google_ads': 'Google Ads',
    'facebook_ads': 'Facebook Ads',
    'organic': 'Organic',
  };
  return labels[raw] ?? _titleCase(raw);
}

String _titleCase(String s) => s
    .replaceAll('_', ' ')
    .split(' ')
    .map((w) => w.isEmpty ? w : '${w[0].toUpperCase()}${w.substring(1)}')
    .join(' ');

String titleCase(String? s) => s == null || s.isEmpty ? '—' : _titleCase(s);

String temperatureLabel(Lead lead) {
  final t = lead.isHot || lead.temperature == 'hot' ? 'hot' : (lead.temperature ?? 'warm');
  return _titleCase(t);
}

Color temperatureColor(Lead lead) {
  switch (temperatureLabel(lead).toLowerCase()) {
    case 'hot':
      return EmbTheme.coral;
    case 'vip':
      return EmbTheme.saffron;
    case 'cold':
      return EmbTheme.sky;
    default:
      return EmbTheme.saffron;
  }
}

class LeadScores {
  const LeadScores({
    required this.overall,
    required this.budget,
    required this.engagement,
    required this.response,
    required this.conversion,
  });
  final int overall;
  final int budget;
  final int engagement;
  final int response;
  final int conversion;
}

/// Port of the website `computeLeadScores`.
LeadScores computeLeadScores(Lead lead, {int followupCount = 0, int quoteCount = 0}) {
  final smart = (lead.smartScore ?? 0).round();
  final b = (lead.budget ?? 0).toDouble();
  final budgetScore = b >= 70000
      ? 90
      : b >= 50000
          ? 80
          : b >= 30000
              ? 70
              : b >= 15000
                  ? 55
                  : 40;
  final engagement =
      (followupCount * 12 + quoteCount * 18 + (lead.lastContactedAt != null ? 25 : 10)).clamp(0, 100);
  final responseRate = ((lead.raw?['responseRate'] as num?) ?? 0).round();
  final response = responseRate > 0 ? responseRate : (engagement + 10).clamp(0, 90);
  const statusMap = {
    'converted': 100,
    'negotiation': 72,
    'quotation_sent': 65,
    'follow_up': 55,
    'contacted': 40,
    'new': 25,
  };
  final conversion = statusMap[lead.status] ?? (smart > 0 ? smart : 50);
  final overall = smart > 0 ? smart : ((budgetScore + engagement + response + conversion) / 4).round();
  return LeadScores(
    overall: overall,
    budget: budgetScore,
    engagement: engagement,
    response: response,
    conversion: conversion,
  );
}

/// Tags derived from lead fields (display only), as on the website.
List<String> deriveLeadTags(Lead lead) {
  final tags = <String>[];
  if (lead.destination != null && lead.destination!.isNotEmpty) {
    tags.add(lead.destination!.split(',').first.trim());
  }
  if (lead.hotelCategory != null && lead.hotelCategory!.isNotEmpty) tags.add(lead.hotelCategory!);
  if (lead.isHot || lead.temperature == 'hot') tags.add('Hot');
  final meal = lead.raw?['mealPreference']?.toString();
  if (meal != null && meal.isNotEmpty) tags.add(meal);
  if (lead.leadType == 'family' || (lead.children ?? 0) > 0) tags.add('Family');
  final seen = <String>{};
  return tags.where(seen.add).take(6).toList();
}

/// Soonest pending follow-up.
FollowUp? upcomingFollowUp(List<FollowUp> items) {
  final pending = items
      .where((f) => (f.status ?? 'pending') == 'pending' && f.scheduledAt.isNotEmpty)
      .toList()
    ..sort((a, b) => a.scheduledAt.compareTo(b.scheduledAt));
  if (pending.isEmpty) return null;
  final now = DateTime.now();
  final future = pending.where((f) => (parseDate(f.scheduledAt) ?? now).isAfter(now.subtract(const Duration(hours: 1))));
  return future.isNotEmpty ? future.first : pending.last;
}

class ActivityStyle {
  const ActivityStyle(this.label, this.icon, this.color);
  final String label;
  final IconData icon;
  final Color color;
}

ActivityStyle activityStyle(String? type) {
  switch (type) {
    case 'lead_created':
      return const ActivityStyle('Lead Created', Icons.person_add_alt_1, EmbTheme.sky);
    case 'lead_assigned':
    case 'lead_reassigned':
    case 'lead_transferred':
      return ActivityStyle(_titleCase(type!), Icons.how_to_reg_outlined, const Color(0xFF7C5CE0));
    case 'call_made':
    case 'call_note_added':
      return ActivityStyle(_titleCase(type!), Icons.call, EmbTheme.mint);
    case 'whatsapp_sent':
    case 'whatsapp_contact_initiated':
      return ActivityStyle(_titleCase(type!), Icons.chat, const Color(0xFF25D366));
    case 'email_sent':
      return const ActivityStyle('Email Sent', Icons.mail_outline, EmbTheme.sky);
    case 'followup_added':
      return const ActivityStyle('Follow Up Added', Icons.event_available_outlined, EmbTheme.saffron);
    case 'followup_completed':
      return const ActivityStyle('Follow Up Completed', Icons.event_available, EmbTheme.mint);
    case 'followup_missed':
      return const ActivityStyle('Follow-up Missed', Icons.event_busy, EmbTheme.danger);
    case 'quotation_sent':
    case 'quotation_created':
    case 'quotation_approved':
      return ActivityStyle(_titleCase(type!), Icons.description_outlined, EmbTheme.saffron);
    case 'lead_reactivated':
    case 'reactivation_progress':
    case 'lead_restored':
      return ActivityStyle(_titleCase(type!), Icons.refresh, EmbTheme.teal);
    case 'status_changed':
      return const ActivityStyle('Status Changed', Icons.swap_horiz, Color(0xFF6366F1));
    case 'lead_converted':
    case 'booking_created':
      return ActivityStyle(_titleCase(type!), Icons.emoji_events_outlined, EmbTheme.mint);
    case 'advance_payment_received':
    case 'payment_received':
    case 'receipt_sent':
      return ActivityStyle(_titleCase(type!), Icons.payments_outlined, EmbTheme.mint);
    case 'lead_lost':
    case 'lead_deleted':
    case 'sla_breached':
      return ActivityStyle(_titleCase(type!), Icons.cancel_outlined, EmbTheme.danger);
    case 'lead_edited':
    case 'lead_merged':
      return ActivityStyle(_titleCase(type!), Icons.edit_outlined, EmbTheme.inkSoft);
    case 'escalation_created':
      return const ActivityStyle('Escalation Created', Icons.warning_amber_rounded, EmbTheme.saffron);
    default:
      return ActivityStyle(_titleCase(type ?? 'Activity'), Icons.bolt_outlined, EmbTheme.teal);
  }
}

/// Merges the DB timeline with items derived from the lead, follow-ups and quotations
/// (port of the website `mergeLeadActivities`). Newest first.
List<Map<String, dynamic>> buildActivities({
  required Lead lead,
  required List<Map<String, dynamic>> timeline,
  required List<FollowUp> followups,
  required List<Quotation> quotations,
}) {
  final out = <Map<String, dynamic>>[...timeline];
  final types = timeline.map((e) => e['type']?.toString()).toSet();

  if (!types.contains('lead_created')) {
    out.add({
      'id': 'syn-created',
      'type': 'lead_created',
      'user': lead.createdByName ?? 'System',
      'date': lead.createdAt,
      'notes': 'Lead created from ${sourceLabel(lead)}',
    });
  }

  if (!timeline.any((e) => (e['type']?.toString() ?? '').startsWith('followup_'))) {
    for (final f in followups) {
      out.add({
        'id': 'syn-fu-${f.id}',
        'type': f.status == 'completed' ? 'followup_completed' : 'followup_added',
        'user': '',
        'date': f.scheduledAt,
        'notes': [
          titleCase(f.type ?? 'call'),
          if (f.priority != null) titleCase(f.priority),
          'Scheduled ${fmtDateTime(f.scheduledAt)}',
          if (f.notes != null && f.notes!.isNotEmpty) f.notes!,
        ].join(' · '),
      });
    }
  }

  final timelineQuoteIds = timeline
      .map((e) => (e['meta'] is Map ? (e['meta'] as Map)['quotationId'] : null)?.toString())
      .whereType<String>()
      .toSet();
  for (final q in quotations) {
    if (timelineQuoteIds.contains(q.id)) continue;
    out.add({
      'id': 'syn-q-${q.id}',
      'type': 'quotation_created',
      'user': '',
      'date': q.createdAt,
      'notes': '${q.quoteNumber ?? 'Quote'} · ${q.packageName} · ${formatInr(q.total)} · ${prettyWords(q.status ?? 'draft')}',
      'meta': {'quotationId': q.id},
    });
  }

  out.sort((a, b) {
    final da = parseDate(a['date']?.toString()) ?? DateTime.fromMillisecondsSinceEpoch(0);
    final db = parseDate(b['date']?.toString()) ?? DateTime.fromMillisecondsSinceEpoch(0);
    return db.compareTo(da);
  });
  return out;
}

String prettyWords(String s) => _titleCase(s);

String formatInr(num v) => NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0).format(v);

/// WhatsApp deep-link digits (assumes India for 10-digit numbers).
String whatsappDigits(String phone) {
  var d = phone.replaceAll(RegExp(r'[^\d]'), '');
  if (d.length == 10) d = '91$d';
  return d;
}
