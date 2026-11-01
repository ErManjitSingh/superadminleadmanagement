import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../core/emb_theme.dart';
import '../models/models.dart';
import '../providers/notification_hub.dart';
import '../services/notification_actions.dart';
import '../widgets/common_widgets.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await context.read<NotificationHub>().refresh();
      if (mounted) setState(() => _loading = false);
    });
  }

  Future<void> _openLead(AppNotification n) async {
    final hub = context.read<NotificationHub>();
    if (!n.read) await hub.markRead(n.id);
    final p = NotificationPayload.fromAppNotification(n);
    if (p.hasLead && mounted) {
      await openLeadFromNotification(p.leadId!);
    }
  }

  @override
  Widget build(BuildContext context) {
    final hub = context.watch<NotificationHub>();
    final items = hub.items;

    return Scaffold(
      backgroundColor: EmbTheme.cream,
      appBar: AppBar(
        backgroundColor: EmbTheme.white,
        title: Text('Notifications', style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700)),
        actions: [
          if (hub.unreadCount > 0)
            TextButton(
              onPressed: () => hub.markAllRead(),
              child: const Text('Mark all read'),
            ),
          IconButton(
            tooltip: 'Test sound',
            icon: const Icon(Icons.notifications_active_outlined),
            onPressed: () => hub.sendTestNotification(),
          ),
          IconButton(
            tooltip: 'Refresh',
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () async {
              setState(() => _loading = true);
              await hub.refresh();
              if (mounted) setState(() => _loading = false);
            },
          ),
        ],
      ),
      body: _loading && items.isEmpty
          ? const Center(child: CircularProgressIndicator(color: EmbTheme.teal))
          : RefreshIndicator(
              color: EmbTheme.teal,
              onRefresh: hub.refresh,
              child: items.isEmpty
                  ? ListView(
                      children: const [
                        SizedBox(height: 120),
                        EmptyState(message: 'No notifications yet'),
                      ],
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 40),
                      itemCount: items.length,
                      itemBuilder: (_, i) {
                        final n = items[i];
                        return _NotifTile(
                          notification: n,
                          onOpen: () => _openLead(n),
                          onCall: () async {
                            final p = NotificationPayload.fromAppNotification(n);
                            if (!n.read) await hub.markRead(n.id);
                            if (p.hasPhone) await launchCall(p.phone!);
                          },
                          onWhatsApp: () async {
                            final p = NotificationPayload.fromAppNotification(n);
                            if (!n.read) await hub.markRead(n.id);
                            if (p.hasPhone) await launchWhatsApp(p.phone!);
                          },
                        );
                      },
                    ),
            ),
    );
  }
}

class _NotifTile extends StatelessWidget {
  const _NotifTile({
    required this.notification,
    required this.onOpen,
    required this.onCall,
    required this.onWhatsApp,
  });

  final AppNotification notification;
  final VoidCallback onOpen;
  final VoidCallback onCall;
  final VoidCallback onWhatsApp;

  @override
  Widget build(BuildContext context) {
    final n = notification;
    final p = NotificationPayload.fromAppNotification(n);
    final isLead = (n.type ?? '').toLowerCase().contains('lead') ||
        (n.type ?? '').toLowerCase().contains('assign') ||
        p.hasLead;

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: n.read ? EmbTheme.white : EmbTheme.tealSoft,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onOpen,
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: EmbTheme.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        color: n.read ? const Color(0xFFF0EBE3) : EmbTheme.teal,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        n.read ? Icons.notifications_none_rounded : Icons.notifications_active_rounded,
                        color: n.read ? EmbTheme.muted : Colors.white,
                        size: 22,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            n.title,
                            style: GoogleFonts.plusJakartaSans(
                              fontWeight: FontWeight.w800,
                              color: EmbTheme.ink,
                              fontSize: 15,
                            ),
                          ),
                          if (p.leadName != null && p.leadName!.isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Text(
                              p.leadName!,
                              style: GoogleFonts.plusJakartaSans(
                                fontWeight: FontWeight.w700,
                                color: EmbTheme.teal,
                                fontSize: 14,
                              ),
                            ),
                          ],
                          if (p.hasPhone) ...[
                            const SizedBox(height: 2),
                            Text(
                              p.phone!,
                              style: GoogleFonts.plusJakartaSans(
                                color: EmbTheme.inkSoft,
                                fontSize: 13.5,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                          if ((n.message ?? '').isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Text(
                              n.message!,
                              style: GoogleFonts.plusJakartaSans(
                                color: EmbTheme.inkSoft,
                                fontSize: 13,
                                height: 1.35,
                              ),
                            ),
                          ],
                          const SizedBox(height: 6),
                          Text(
                            formatDate(n.createdAt),
                            style: GoogleFonts.plusJakartaSans(color: EmbTheme.muted, fontSize: 11.5),
                          ),
                        ],
                      ),
                    ),
                    if (!n.read)
                      Container(
                        width: 9,
                        height: 9,
                        margin: const EdgeInsets.only(top: 6, left: 6),
                        decoration: const BoxDecoration(color: EmbTheme.saffron, shape: BoxShape.circle),
                      ),
                  ],
                ),
                if (isLead) ...[
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      if (p.hasPhone)
                        _ActionChip(
                          icon: Icons.call_rounded,
                          label: 'Call',
                          color: EmbTheme.teal,
                          onTap: onCall,
                        ),
                      if (p.hasPhone)
                        _ActionChip(
                          icon: Icons.chat_rounded,
                          label: 'WhatsApp',
                          color: const Color(0xFF128C7E),
                          onTap: onWhatsApp,
                        ),
                      if (p.hasLead)
                        _ActionChip(
                          icon: Icons.open_in_new_rounded,
                          label: 'Open lead',
                          color: EmbTheme.saffron,
                          onTap: onOpen,
                        ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ActionChip extends StatelessWidget {
  const _ActionChip({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: color.withValues(alpha: 0.12),
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 16, color: color),
              const SizedBox(width: 5),
              Text(
                label,
                style: GoogleFonts.plusJakartaSans(
                  fontWeight: FontWeight.w700,
                  fontSize: 12.5,
                  color: color,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
