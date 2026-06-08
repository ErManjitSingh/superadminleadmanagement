const LeadTransferLog = require('../models/LeadTransferLog');
const { parsePagination, paginatedResponse } = require('../utils/pagination');

async function logLeadTransfer({
  leadId,
  branchId,
  type,
  actor,
  fromUserId = null,
  toUserId = null,
  fromBranchId = null,
  toBranchId = null,
  note = '',
  meta = {},
}) {
  if (!leadId || !type || !actor) return null;
  return LeadTransferLog.create({
    leadId,
    branchId: branchId || null,
    type,
    fromUserId,
    toUserId,
    fromBranchId,
    toBranchId,
    actorId: actor._id || actor.id,
    actorName: actor.name || 'System',
    note,
    meta,
  });
}

async function getLeadTransferHistory(leadId, { page = 1, limit = 30 } = {}) {
  const { skip, limit: lim } = parsePagination({ page, limit });
  const filter = { leadId };
  const [rows, total] = await Promise.all([
    LeadTransferLog.find(filter)
      .populate('fromUserId', 'name role')
      .populate('toUserId', 'name role')
      .populate('fromBranchId', 'name code')
      .populate('toBranchId', 'name code')
      .populate('actorId', 'name role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(lim)
      .lean(),
    LeadTransferLog.countDocuments(filter),
  ]);
  return paginatedResponse(rows, { page, limit: lim, total });
}

module.exports = { logLeadTransfer, getLeadTransferHistory };
