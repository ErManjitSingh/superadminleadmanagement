const ActivityLog = require('../models/ActivityLog');

async function logActivity({ type, user, userId, action, target, ip, meta, branchId }) {
  return ActivityLog.create({
    type,
    user: user || 'System',
    userId,
    branchId: branchId || meta?.branchId || null,
    action,
    target: target || '—',
    ip: ip || '0.0.0.0',
    meta,
  });
}

function getClientIp(req) {
  return req?.ip || req?.headers?.['x-forwarded-for']?.split(',')[0] || '0.0.0.0';
}

module.exports = { logActivity, getClientIp };
