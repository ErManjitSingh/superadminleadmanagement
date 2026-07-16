const WebsiteActivityLog = require('../models/WebsiteActivityLog');

async function logWebsiteActivity({
  actor,
  action,
  resourceType,
  resourceId,
  title = '',
  metadata = {},
  req,
}) {
  try {
    await WebsiteActivityLog.create({
      actorId: actor?._id || null,
      actorEmail: actor?.email || '',
      actorName: actor?.name || '',
      action,
      resourceType,
      resourceId: resourceId || null,
      title,
      metadata,
      ipAddress: req?.ip || req?.headers?.['x-forwarded-for'] || null,
      userAgent: req?.headers?.['user-agent'] || null,
    });
  } catch (err) {
    console.error('[WebsiteActivity] Failed to log:', err.message);
  }
}

module.exports = { logWebsiteActivity };
