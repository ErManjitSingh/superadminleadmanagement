const AuditLog = require('../models/AuditLog');

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
  const skip = (Math.max(1, page) - 1) * limit;
  const filter = { entityType, entityId };
  const [data, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AuditLog.countDocuments(filter),
  ]);
  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 0 } };
}

async function listBranchAuditLogs(branchId, { page = 1, limit = 50, action, entityType = 'lead' } = {}) {
  const skip = (Math.max(1, page) - 1) * limit;
  const filter = { entityType, ...(branchId ? { branchId } : {}), ...(action ? { action } : {}) };
  const [data, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AuditLog.countDocuments(filter),
  ]);
  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 0 } };
}

module.exports = { logAudit, diffLeadChanges, getEntityAuditLog, listBranchAuditLogs };
