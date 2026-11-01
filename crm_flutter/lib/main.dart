import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/api_client.dart';
import 'core/storage.dart';
import 'core/theme.dart';
import 'providers/auth_provider.dart';
import 'providers/notification_hub.dart';
import 'screens/home_shell.dart';
import 'screens/login_screen.dart';
import 'services/ai_itinerary_service.dart';
import 'services/auth_service.dart';
import 'services/email_service.dart';
import 'services/followups_service.dart';
import 'services/leads_service.dart';
import 'services/local_notify.dart';
import 'services/notifications_api.dart';
import 'services/notification_actions.dart';
import 'services/push_background_service.dart';
import 'services/operations_service.dart';
import 'services/packages_service.dart';
import 'services/payments_service.dart';
import 'services/quotations_service.dart';
import 'services/reminders_service.dart';
import 'services/reports_service.dart';
import 'services/team_service.dart';
import 'services/whatsapp_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await LocalNotify.instance.init();
  await PushBackgroundService.init();
  runApp(const CrmApp());
}

class CrmApp extends StatelessWidget {
  const CrmApp({super.key});

  @override
  Widget build(BuildContext context) {
    final storage = AuthStorage();
    final api = ApiClient(storage);
    final authService = AuthService(api);
    final notificationsApi = NotificationsApi(api);

    return MultiProvider(
      providers: [
        Provider.value(value: storage),
        Provider.value(value: api),
        Provider.value(value: authService),
        Provider.value(value: notificationsApi),
        Provider(create: (_) => LeadsService(api)),
        Provider(create: (_) => FollowupsService(api)),
        Provider(create: (_) => QuotationsService(api)),
        Provider(create: (_) => AiItineraryService(api)),
        Provider(create: (_) => OperationsService(api)),
        Provider(create: (_) => PackagesService(api)),
        Provider(create: (_) => PaymentsService(api)),
        Provider(create: (_) => ReportsService(api)),
        Provider(create: (_) => TeamService(api)),
        Provider(create: (_) => EmailService(api)),
        Provider(create: (_) => WhatsappService(api)),
        Provider(create: (_) => RemindersService(api)),
        ChangeNotifierProvider(
          create: (_) {
            final auth = AuthProvider(
              storage: storage,
              api: api,
              authService: authService,
            );
            api.onUnauthorized = () => auth.clearSession();
            auth.bootstrap();
            return auth;
          },
        ),
        ChangeNotifierProxyProvider<AuthProvider, NotificationHub>(
          create: (ctx) {
            final auth = ctx.read<AuthProvider>();
            return NotificationHub(
              api: notificationsApi,
              resolveToken: () => auth.token,
              resolveApiBase: () => auth.apiUrl.isNotEmpty ? auth.apiUrl : ApiClient.defaultApiUrl,
            );
          },
          update: (ctx, auth, hub) {
            final h = hub ??
                NotificationHub(
                  api: notificationsApi,
                  resolveToken: () => auth.token,
                  resolveApiBase: () => auth.apiUrl.isNotEmpty ? auth.apiUrl : ApiClient.defaultApiUrl,
                );
            if (auth.isAuthenticated) {
              h.start();
            } else {
              h.stop();
            }
            return h;
          },
        ),
      ],
      child: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          return MaterialApp(
            title: 'Explore My Bharat',
            navigatorKey: crmNavigatorKey,
            debugShowCheckedModeBanner: false,
            theme: buildAppTheme(),
            home: auth.isLoading
                ? const Scaffold(
                    body: Center(child: CircularProgressIndicator()),
                  )
                : auth.isAuthenticated
                    ? const HomeShell()
                    : const LoginScreen(),
          );
        },
      ),
    );
  }
}
