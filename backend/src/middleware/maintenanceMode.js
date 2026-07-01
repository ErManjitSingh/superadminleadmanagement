const asyncHandler = require('../utils/asyncHandler');
const PlatformSettings = require('../superadmin/models/PlatformSettings');

const EXEMPT_PREFIXES = [
  '/api/health',
  '/api/public',
  '/api/tenant',
  '/api/superadmin',
];

function isExempt(path) {
  return EXEMPT_PREFIXES.some((p) => path.startsWith(p));
}

const checkMaintenanceMode = asyncHandler(async (req, res, next) => {
  const path = req.originalUrl || req.url || '';
  if (isExempt(path)) return next();

  const row = await PlatformSettings.findOne({ key: 'maintenance_mode' }).lean();
  if (row?.value === true || row?.value === 'true') {
    return res.status(503).json({
      maintenance: true,
      scope: 'platform',
      message: 'Platform is under maintenance. Please try again shortly.',
    });
  }

  const company = req.resolvedCompany || req.tenantCompany;
  if (company?.maintenanceMode) {
    return res.status(503).json({
      maintenance: true,
      scope: 'company',
      message: 'This workspace is temporarily under maintenance.',
    });
  }

  next();
});

module.exports = { checkMaintenanceMode };
