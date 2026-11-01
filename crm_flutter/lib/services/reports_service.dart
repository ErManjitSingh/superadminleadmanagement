import '../core/api_client.dart';
import '../core/roles.dart';
import 'service_utils.dart';

/// Role reports + /reports/analytics.
class ReportsService {
  ReportsService(this._api);
  final ApiClient _api;

  /// Role-specific report payload.
  /// sales_manager -> /sales-manager/reports, team_leader -> /team-leader/reports,
  /// operations_manager -> /operations-manager/reports, admin -> /reports/analytics.
  Future<Json> fetchRoleReport(String role) async {
    final String path;
    switch (role) {
      case 'operations_manager':
        path = '/operations-manager/reports';
        break;
      case 'admin':
        path = '/reports/analytics';
        break;
      case 'sales_manager':
      case 'team_leader':
        path = '${getRoleApiPrefix(role)}/reports';
        break;
      default:
        path = '/sales-executive/dashboard';
    }
    final res = await _api.get(path);
    return asMap(res.data);
  }

  /// Admin / sales manager analytics.
  Future<Json> fetchAnalytics() async {
    final res = await _api.get('/reports/analytics');
    return asMap(res.data);
  }
}
