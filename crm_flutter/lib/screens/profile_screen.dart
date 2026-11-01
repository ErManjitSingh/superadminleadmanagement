import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/roles.dart';
import '../core/theme.dart';
import '../providers/auth_provider.dart';
import '../providers/notification_hub.dart';
import 'notifications_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor: AppColors.primaryLight,
                  child: Text(
                    (user?.name.isNotEmpty == true ? user!.name[0] : '?').toUpperCase(),
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w800,
                      fontSize: 22,
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(user?.name ?? '', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
                      Text(user?.email ?? '', style: const TextStyle(color: AppColors.textSecondary)),
                      const SizedBox(height: 4),
                      Text(
                        roleLabels[user?.role] ?? user?.role ?? '',
                        style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        ListTile(
          leading: const Icon(Icons.notifications_outlined),
          title: const Text('Notifications'),
          trailing: const Icon(Icons.chevron_right),
          onTap: () {
            Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const NotificationsScreen()),
            );
          },
        ),
        ListTile(
          leading: const Icon(Icons.notifications_active_outlined),
          title: const Text('Test notification sound'),
          subtitle: const Text('Android alert with sound'),
          onTap: () => context.read<NotificationHub>().sendTestNotification(),
        ),
        ListTile(
          leading: const Icon(Icons.dns_outlined),
          title: const Text('API URL'),
          subtitle: Text(auth.apiUrl),
        ),
        const SizedBox(height: 20),
        ElevatedButton.icon(
          style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
          onPressed: () => auth.logout(),
          icon: const Icon(Icons.logout),
          label: const Text('Sign out'),
        ),
      ],
    );
  }
}
