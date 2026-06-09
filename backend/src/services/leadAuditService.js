const AuditLog = require('../models/AuditLog');
const { clampLimit, DETAIL_MAX_LIMIT } = require('../utils/pagination');

async function logAudit({
  entityType,
  entityId,
  branchId,
  action,
  actor,
  changes = [],
  ip,
  meta = {},
}) {
  return AuditLog.create({
    entityType,
    entityId,
    branchId: branchId || null,
    action,
    actorId: actor?._id || actor?.id || null,
    actorName: actor?.name || 'System',
    changes,
    ip,
    meta,
  });
}

function diffLeadChanges(before = {}, after = {}, fields = []) {
  const tracked = fields.length
    ? fields
    : ['name', 'phone', 'email', 'status', 'budget', 'destination', 'assignedTo', 'temperature', 'smartScore'];
  const changes = [];
  for (const field of tracked) {
    const oldVal = before[field];
    const newVal = after[field];
    const oldStr = oldVal?.toString?.() ?? oldVal;
    const newStr = newVal?.toString?.() ?? newVal;
    if (oldStr !== newStr && (oldVal !== undefined || newVal !== undefined)) {
      changes.push({ field, oldValue: oldVal ?? null, newValue: newVal ?? null });
    }
  }
  return changes;
}

async function getEntityAuditLog(entityType, entityId, { page = 1, limit = 50 } = {}) {
  const lim = clampLimit(limit, { defaultLimit: 20, maxLimit: DETAIL_MAX_LIMIT });
  const skip = (Math.max(1, page) - 1) * lim;
  const filter = { entityType, entityId };
  const [data, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim).lean(),
    AuditLog.countDocuments(filter),
  ]);
  return { data, pagination: { page, limit: lim, total, totalPages: Math.ceil(total / lim) || 0 } };
}

async function listBranchAuditLogs(branchId, { page = 1, limit = 50, action, entityType = 'lead' } = {}) {
  const lim = clampLimit(limit, { defaultLimit: 30, maxLimit: DETAIL_MAX_LIMIT });
  const skip = (Math.max(1, page) - 1) * lim;
  const filter = { entityType, ...(branchId ? { branchId } : {}), ...(action ? { action } : {}) };
  const [data, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim).lean(),
    AuditLog.countDocuments(filter),
  ]);
  return { data, pagination: { page, limit: lim, total, totalPages: Math.ceil(total / lim) || 0 } };
}

module.exports = { logAudit, diffLeadChanges, getEntityAuditLog, listBranchAuditLogs };
