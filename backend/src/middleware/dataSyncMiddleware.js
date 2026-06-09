const { resolveDataKeys } = require('../services/dataSyncService');
const { invalidate: invalidateDashboardCache } = require('../services/dashboardCacheService');

/** After successful mutations, invalidate server-side dashboard cache (no socket broadcast). */
function dataSyncMiddleware(req, res, next) {
  res.on('finish', () => {
    if (res.statusCode < 200 || res.statusCode >= 300) return;
    const keys = resolveDataKeys(req);
    if (!keys?.length) return;

    if (keys.some((k) => ['leads', 'followups', 'quotations', 'dashboard', 'payments'].includes(k))) {
      ['admin', 'sales_manager', 'sales_executive', 'team_leader'].forEach((role) =>
        invalidateDashboardCache(role)
      );
      invalidateDashboardCache('nav:');
    }
  });
  next();
}

module.exports = dataSyncMiddleware;
