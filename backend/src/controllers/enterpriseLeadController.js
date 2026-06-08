const Lead = require('../models/Lead');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { parsePagination, paginatedResponse } = require('../utils/pagination');
const { LEAD_POPULATE, enrichLead } = require('../utils/queryHelpers');
const { findDuplicateLeads } = require('../services/duplicateDetectionService');
const { getLeadTimeline } = require('../services/leadActivityService');
const { getEntityAuditLog } = require('../services/leadAuditService');
const { logLeadActivity } = require('../services/leadActivityService');
const { logAudit } = require('../services/leadAuditService');
const { getClientIp } = require('../services/activityService');

const checkDuplicate = asyncHandler(async (req, res) => {
  const { phone, alternatePhone, email, excludeId } = req.query;
  const duplicates = await findDuplicateLeads({
    phone,
    alternatePhone,
    email,
    branchId: req.branchId,
    excludeId,
  });

  res.json({
    isDuplicate: duplicates.length > 0,
    matches: duplicates.map((d) => ({
      _id: d._id,
      leadId: d.leadId,
      name: d.name,
      phone: d.phone,
      email: d.email,
      assignedTo: d.assignedTo,
      createdAt: d.createdAt,
      status: d.status,
      daysAgo: Math.floor((Date.now() - new Date(d.createdAt).getTime()) / 86400000),
    })),
  });
});

const getTimeline = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({
    _id: req.params.id,
    ...(req.branchId ? { branchId: req.branchId } : {}),
    isDeleted: { $ne: true },
  }).select('_id');
  if (!lead) throw new ApiError(404, 'Lead not found');

  const result = await getLeadTimeline(lead._id, {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 50,
  });
  res.json(result);
});

const getAudit = asyncHandler(async (req, res) => {
  if (!['admin', 'sales_manager'].includes(req.user.role)) {
    throw new ApiError(403, 'Audit log access restricted');
  }
  const lead = await Lead.findOne({
    _id: req.params.id,
    ...(req.branchId ? { branchId: req.branchId } : {}),
  }).select('_id');
  if (!lead) throw new ApiError(404, 'Lead not found');

  const result = await getEntityAuditLog('lead', lead._id, {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 50,
  });
  res.json(result);
});

const listRecycleBin = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {
    isDeleted: true,
    ...(req.branchId ? { branchId: req.branchId } : {}),
  };
  const [rows, total] = await Promise.all([
    Lead.find(filter).populate(LEAD_POPULATE).sort({ deletedAt: -1 }).skip(skip).limit(limit).lean(),
    Lead.countDocuments(filter),
  ]);
  res.json(paginatedResponse(rows.map(enrichLead), { page, limit, total }));
});

const restoreLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({
    _id: req.params.id,
    isDeleted: true,
    ...(req.branchId ? { branchId: req.branchId } : {}),
  });
  if (!lead) throw new ApiError(404, 'Deleted lead not found');

  lead.isDeleted = false;
  lead.deletedAt = null;
  lead.deletedBy = null;
  await lead.save();

  await logLeadActivity({
    leadId: lead._id,
    branchId: lead.branchId,
    type: 'lead_restored',
    description: `Lead restored by ${req.user.name}`,
    actor: req.user,
  });
  await logAudit({
    entityType: 'lead',
    entityId: lead._id,
    branchId: lead.branchId,
    action: 'lead.restored',
    actor: req.user,
    ip: getClientIp(req),
  });

  const populated = await Lead.findById(lead._id).populate(LEAD_POPULATE).lean();
  res.json(enrichLead(populated));
});

const permanentDeleteLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({
    _id: req.params.id,
    isDeleted: true,
    ...(req.branchId ? { branchId: req.branchId } : {}),
  });
  if (!lead) throw new ApiError(404, 'Deleted lead not found in recycle bin');
  await lead.deleteOne();
  res.json({ message: 'Lead permanently deleted' });
});

const getAgingAnalytics = asyncHandler(async (req, res) => {
  const match = { isDeleted: { $ne: true }, ...(req.branchId ? { branchId: req.branchId } : {}) };
  const buckets = await Lead.aggregate([
    { $match: match },
    { $group: { _id: '$agingBucket', count: { $sum: 1 } } },
  ]);
  const labels = { '0_7': '0-7 Days', '8_15': '8-15 Days', '16_30': '16-30 Days', '30_plus': '30+ Days' };
  res.json({
    buckets: buckets.map((b) => ({
      key: b._id,
      label: labels[b._id] || b._id,
      count: b.count,
    })),
  });
});

module.exports = {
  checkDuplicate,
  getTimeline,
  getAudit,
  listRecycleBin,
  restoreLead,
  permanentDeleteLead,
  getAgingAnalytics,
};
