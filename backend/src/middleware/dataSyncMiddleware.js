const { resolveDataKeys, emitDataChanged } = require('../services/dataSyncService');
const { invalidate: invalidateDashboardCache } = require('../services/dashboardCacheService');

/** After successful mutations, notify all connected clients to refetch lists. */
function dataSyncMiddleware(req, res, next) {
  res.on('finish', () => {
    if (res.statusCode < 200 || res.statusCode >= 300) return;
    const keys = resolveDataKeys(req);
    if (keys?.length) {
      emitDataChanged(keys);
      if (keys.some((k) => ['leads', 'followups', 'quotations', 'dashboard', 'payments'].includes(k))) {
        ['admin', 'sales_manager', 'sales_executive', 'team_leader'].forEach((role) =>
          invalidateDashboardCache(role)
        );
      }
    }
  });
  next();
}

module.exports = dataSyncMiddleware;
