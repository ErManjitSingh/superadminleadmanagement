import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../core/crm_menu.dart';
import '../core/emb_theme.dart';
import '../core/crm_navigation.dart';
import '../providers/auth_provider.dart';
import 'lead_form_screen.dart';

/// Role-based “More” menu — every item opens a NATIVE Flutter screen via [ModuleRouter].
class MenuScreen extends StatelessWidget {
  const MenuScreen({super.key});

  void _open(BuildContext context, Widget screen) {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => screen));
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final role = auth.user?.role;
    final items = menuForRole(role);

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFFE5F6F6), Color(0xFFFFF0E6)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: EmbTheme.border),
          ),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: EmbTheme.teal,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(Icons.apps_rounded, color: Colors.white),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'All CRM modules',
                      style: GoogleFonts.plusJakartaSans(
                        fontWeight: FontWeight.w800,
                        fontSize: 17,
                        color: EmbTheme.ink,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Every CRM module, built natively in the app',
                      style: GoogleFonts.plusJakartaSans(color: EmbTheme.inkSoft, fontSize: 13),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        if (role != 'operations_manager')
          _tile(
            context,
            icon: Icons.person_add_alt_1_rounded,
            label: 'New lead',
            subtitle: 'Add a lead quickly',
            onTap: () => _open(context, const LeadFormScreen()),
          ),
        const SizedBox(height: 8),
        Text(
          'Modules',
          style: GoogleFonts.plusJakartaSans(
            fontWeight: FontWeight.w800,
            fontSize: 13,
            color: EmbTheme.muted,
            letterSpacing: 0.3,
          ),
        ),
        const SizedBox(height: 8),
        ...items.map((item) {
          if (item.children != null && item.children!.isNotEmpty) {
            return _ExpansionGroup(item: item);
          }
          return _tile(
            context,
            icon: item.icon,
            label: item.label,
            onTap: item.nativeId == null
                ? null
                : () => openCrmModule(
                      context,
                      item.nativeId!,
                      filter: item.filter,
                      title: item.label,
                    ),
          );
        }),
      ],
    );
  }

  static Widget _tile(
    BuildContext context, {
    required IconData icon,
    required String label,
    String? subtitle,
    VoidCallback? onTap,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: EmbTheme.white,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: EmbTheme.border),
            ),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: EmbTheme.tealSoft,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, color: EmbTheme.teal, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        label,
                        style: GoogleFonts.plusJakartaSans(
                          fontWeight: FontWeight.w700,
                          color: EmbTheme.ink,
                          fontSize: 15,
                        ),
                      ),
                      if (subtitle != null)
                        Text(
                          subtitle,
                          style: GoogleFonts.plusJakartaSans(color: EmbTheme.muted, fontSize: 12),
                        ),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right_rounded, color: EmbTheme.muted),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ExpansionGroup extends StatelessWidget {
  const _ExpansionGroup({required this.item});

  final CrmMenuItem item;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: EmbTheme.white,
        borderRadius: BorderRadius.circular(14),
        child: Theme(
          data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
          child: ExpansionTile(
            tilePadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
            childrenPadding: const EdgeInsets.fromLTRB(8, 0, 8, 10),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
              side: const BorderSide(color: EmbTheme.border),
            ),
            collapsedShape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
              side: const BorderSide(color: EmbTheme.border),
            ),
            leading: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: EmbTheme.saffronSoft,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(item.icon, color: EmbTheme.saffron, size: 20),
            ),
            title: Text(
              item.label,
              style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700, color: EmbTheme.ink),
            ),
            children: item.children!
                .map(
                  (child) => ListTile(
                    dense: true,
                    leading: Icon(child.icon, color: EmbTheme.teal, size: 20),
                    title: Text(
                      child.label,
                      style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600, fontSize: 14),
                    ),
                    trailing: const Icon(Icons.chevron_right_rounded, size: 18, color: EmbTheme.muted),
                    onTap: child.nativeId == null
                        ? null
                        : () => openCrmModule(
                              context,
                              child.nativeId!,
                              filter: child.filter,
                              title: child.label,
                            ),
                  ),
                )
                .toList(),
          ),
        ),
      ),
    );
  }
}
