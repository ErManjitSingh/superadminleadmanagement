import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../core/emb_theme.dart';

/// Shared building blocks for native EMB-styled CRM screens.

PreferredSizeWidget embAppBar(String title, {List<Widget>? actions}) {
  return AppBar(
    backgroundColor: EmbTheme.white,
    foregroundColor: EmbTheme.ink,
    elevation: 0,
    title: Text(
      title,
      style: embDisplay(size: 20, weight: FontWeight.w700),
    ),
    actions: actions,
  );
}

/// Display / titles — Sora (whole app).
TextStyle embDisplay({
  double size = 22,
  FontWeight weight = FontWeight.w700,
  Color? color,
  double? height,
  double? letterSpacing,
}) =>
    GoogleFonts.sora(
      fontSize: size,
      fontWeight: weight,
      color: color ?? EmbTheme.ink,
      height: height,
      letterSpacing: letterSpacing ?? (size >= 20 ? -0.3 : -0.15),
    );

/// Body / UI — Plus Jakarta Sans (whole app).
TextStyle embBody({
  double size = 14,
  FontWeight weight = FontWeight.w500,
  Color? color,
  double? height,
  double? letterSpacing,
}) =>
    GoogleFonts.plusJakartaSans(
      fontSize: size,
      fontWeight: weight,
      color: color ?? EmbTheme.ink,
      height: height ?? 1.4,
      letterSpacing: letterSpacing,
    );

InputDecoration embInput(String label, {String? hint, IconData? icon}) {
  OutlineInputBorder border([Color c = EmbTheme.border]) => OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: c),
      );
  return InputDecoration(
    labelText: label,
    hintText: hint,
    prefixIcon: icon == null ? null : Icon(icon, size: 18, color: EmbTheme.muted),
    filled: true,
    fillColor: EmbTheme.white,
    labelStyle: embBody(color: EmbTheme.inkSoft),
    border: border(),
    enabledBorder: border(),
    focusedBorder: border(EmbTheme.teal),
    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
  );
}

class EmbCard extends StatelessWidget {
  const EmbCard({super.key, required this.child, this.onTap, this.padding = const EdgeInsets.all(14)});
  final Widget child;
  final VoidCallback? onTap;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: EmbTheme.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: EmbTheme.border),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          child: Padding(padding: padding, child: child),
        ),
      ),
    );
  }
}

class EmbPill extends StatelessWidget {
  const EmbPill(this.text, {super.key, this.color = EmbTheme.teal});
  final String text;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        text,
        style: embBody(size: 11, weight: FontWeight.w700, color: color),
      ),
    );
  }
}

class EmbSectionTitle extends StatelessWidget {
  const EmbSectionTitle(this.text, {super.key});
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(2, 14, 2, 8),
      child: Text(text, style: embDisplay(size: 17, weight: FontWeight.w700)),
    );
  }
}

class EmbErrorView extends StatelessWidget {
  const EmbErrorView({super.key, required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, color: EmbTheme.danger, size: 40),
            const SizedBox(height: 10),
            Text(message, textAlign: TextAlign.center, style: embBody(color: EmbTheme.inkSoft)),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}

class EmbLoading extends StatelessWidget {
  const EmbLoading({super.key});
  @override
  Widget build(BuildContext context) =>
      const Center(child: CircularProgressIndicator(color: EmbTheme.teal));
}

class EmbPrimaryButton extends StatelessWidget {
  const EmbPrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.busy = false,
    this.icon,
  });
  final String label;
  final VoidCallback? onPressed;
  final bool busy;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 50,
      width: double.infinity,
      child: FilledButton.icon(
        style: FilledButton.styleFrom(
          backgroundColor: EmbTheme.teal,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
        onPressed: busy ? null : onPressed,
        icon: busy
            ? const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
              )
            : Icon(icon ?? Icons.check, size: 18),
        label: Text(label, style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700, fontSize: 15)),
      ),
    );
  }
}

void embSnack(BuildContext context, String message, {bool error = false}) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(message),
      backgroundColor: error ? EmbTheme.danger : EmbTheme.ink,
      behavior: SnackBarBehavior.floating,
    ),
  );
}

Color statusTone(String? status) {
  switch ((status ?? '').toLowerCase()) {
    case 'confirmed':
    case 'completed':
    case 'approved':
    case 'issued':
    case 'sent':
    case 'converted':
      return EmbTheme.mint;
    case 'pending':
    case 'booking_received':
    case 'pending_verification':
    case 'pending_approval':
    case 'draft':
      return EmbTheme.saffron;
    case 'in_progress':
    case 'active':
      return EmbTheme.sky;
    case 'cancelled':
    case 'rejected':
    case 'lost':
    case 'missed':
      return EmbTheme.danger;
    default:
      return EmbTheme.teal;
  }
}

String prettyStatus(String? s) {
  if (s == null || s.isEmpty) return '—';
  return s
      .split('_')
      .map((w) => w.isEmpty ? w : '${w[0].toUpperCase()}${w.substring(1)}')
      .join(' ');
}
