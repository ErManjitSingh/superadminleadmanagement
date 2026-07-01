const PlatformAuditLog = require('../models/PlatformAuditLog');

async function logPlatformAudit({
  actor,
  action,
  resourceType,
  resourceId,
  companyId,
  metadata = {},
  req,
}) {
  try {
    await PlatformAuditLog.create({
      actorType: 'super_admin',
      actorId: actor?._id,
      actorEmail: actor?.email,
      action,
      resourceType,
      resourceId,
      companyId,
      metadata,
      ipAddress: req?.ip || req?.headers?.['x-forwarded-for'] || null,
      userAgent: req?.headers?.['user-agent'] || null,
    });
  } catch (err) {
    console.error('[PlatformAudit] Failed to log:', err.message);
  }
}

module.exports = { logPlatformAudit };
