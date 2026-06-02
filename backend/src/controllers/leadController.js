const Lead = require('../models/Lead');
const LeadNote = require('../models/LeadNote');
const FollowUp = require('../models/FollowUp');
const User = require('../models/User');
const Branch = require('../models/Branch');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { LEAD_STATUSES, REACTIVATION_STAGES } = require('../models/Lead');
const { logActivity, getClientIp } = require('../services/activityService');
const {
  notifyLeadCreated,
  notifyLeadAssigned,
  notifyLeadReactivated,
  notifyLeadReassigned,
  notifyReactivationProgress,
  parseAndNotifyMentions,
} = require('../services/notificationService');
const { LEAD_POPULATE, FOLLOWUP_POPULATE, enrichLead } = require('../utils/queryHelpers');
const { createFollowUpForLead } = require('../services/followUpService');
const { normalizeLeadInput, computeLeadScoreByBudget } = require('../utils/normalizeLeadInput');
const { ROLE_LABELS } = require('../config/roles');
const { findLeadsPaginated } = require('../repositories/leadRepository');
const { invalidate: invalidateDashboardCache } = require('../services/dashboardCacheService');
const { parsePagination, paginatedResponse } = require('../utils/pagination');
const { runLeadAutoAssignment } = require('../services/leadAutoAssignmentService');
const { detectLeadType } = require('../services/leadTypeDetectionService');
const { DEMO_LEADS } = require('../data/demoLeads');

const LOST_LEAD_STATUSES = ['lost', 'booked_from_another_company'];
const WORKING_PIPELINE_STATUSES = ['working_progress', 'follow_up', 'quotation_sent', 'negotiation', 'reactivated', 'converted'];
const REACTIVATION_STATUS_TO_STAGE = {
  contacted: 'contacted',
  follow_up: 'follow_up_scheduled',
  quotation_sent: 'quotation_sent',
  converted: 'converted',
};

function setReactivationStage(lead, stage, byUserId, note = '') {
  if (!REACTIVATION_STAGES.includes(stage)) return;
  lead.reactivation = lead.reactivation || {};
  lead.reactivation.isReactivated = true;
  lead.reactivation.stage = stage;
  lead.reactivation.stageUpdatedAt = new Date();
  const history = Array.isArray(lead.reactivation.stageHistory) ? lead.reactivation.stageHistory : [];
  history.push({ stage, by: byUserId, at: new Date(), note });
  lead.reactivation.stageHistory = history;
}

function hasFirstFollowUp(payload = {}) {
  return Boolean(payload.nextFollowUp);
}

function ensureLeadQualifiedForPipeline(payload = {}) {
  if ((Number(payload.budget) || 0) <= 0) {
    throw new ApiError(400, 'Budget is required before moving lead into working pipeline');
  }
  if (!hasFirstFollowUp(payload)) {
    throw new ApiError(400, 'First follow-up date and time are required before moving lead into working pipeline');
  }
}

const listLeads = asyncHandler(async (req, res) => {
  const result = await findLeadsPaginated(req.query, { branchId: req.branchId });
  res.json(result);
});

const getLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({ _id: req.params.id, ...(req.branchId ? { branchId: req.branchId } : {}) })
    .populate(LEAD_POPULATE)
    .lean();
  if (!lead) throw new ApiError(404, 'Lead not found');

  const followups = await FollowUp.find({ lead: lead._id, ...(req.branchId ? { branchId: req.branchId } : {}) })
    .populate(FOLLOWUP_POPULATE)
    .sort({ scheduledAt: -1 })
    .lean();

  res.json({ ...enrichLead(lead), followups });
});

const listLostLeads = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 20, maxLimit: 100 });
  const search = req.query.search?.trim();
  const filter = {
    ...(req.branchId ? { branchId: req.branchId } : {}),
    status: { $in: LOST_LEAD_STATUSES },
    ...(search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
            { destination: { $regex: search, $options: 'i' } },
          ],
        }
      : {}),
  };
  const [rows, total] = await Promise.all([
    Lead.find(filter).populate(LEAD_POPULATE).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    Lead.countDocuments(filter),
  ]);
  res.json(paginatedResponse(rows.map(enrichLead), { page, limit, total }));
});

const createLead = asyncHandler(async (req, res) => {
  const status = req.body.status || 'new';
  if (!LEAD_STATUSES.includes(status)) {
    throw new ApiError(400, 'Invalid lead status');
  }

  const data = normalizeLeadInput(req.body);
  if (!data.name?.trim() || !data.phone?.trim()) {
    throw new ApiError(400, 'Customer name and phone are required');
  }
  if (!data.destination?.trim()) {
    data.destination = 'Not specified';
  }
  if ((Number(data.budget) || 0) <= 0) {
    throw new ApiError(400, 'Budget is required');
  }
  if (!hasFirstFollowUp(data)) {
    throw new ApiError(400, 'First follow-up date and time are required');
  }

  const typeDetection = detectLeadType({ ...req.body, ...data });
  data.leadType = typeDetection.leadType;
  data.leadTypeSource = typeDetection.leadTypeSource;

  data.status = status;
  data.createdBy = req.user._id;
  if (req.user.role === 'admin' && req.body.branchId) {
    const branch = await Branch.findById(req.body.branchId).select('_id status');
    if (!branch || branch.status !== 'active') {
      throw new ApiError(400, 'Invalid branch selected');
    }
    data.branchId = branch._id;
  } else {
    data.branchId = req.branchId || req.user.branchId || null;
  }
  // Only executives auto-own new leads; admin/manager leads stay unassigned until assigned
  if (!data.assignedTo && req.user.role === 'sales_executive') {
    data.assignedTo = req.user._id;
  }

  const lead = await Lead.create(data);

  const shouldAutoAssign =
    !data.assignedTo &&
    req.user.role !== 'sales_executive' &&
    req.body.skipAutoAssign !== true &&
    lead.branchId;

  if (shouldAutoAssign) {
    await runLeadAutoAssignment(lead, { triggeredBy: req.user });
  }

  if (data.nextFollowUp) {
    await createFollowUpForLead({
      body: {
        lead: lead._id,
        scheduledAt: new Date(data.nextFollowUp).toISOString(),
        notes: data.followUpRemarks || '',
        category: 'warm',
      },
      user: req.user,
    });
  }

  await logActivity({
    type: 'lead_created',
    user: req.user.name,
    userId: req.user._id,
    action: `Created lead ${lead.leadId || lead.name}`,
    target: lead.name,
    ip: getClientIp(req),
    branchId: lead.branchId || req.branchId || null,
  });

  const populated = await Lead.findById(lead._id).populate(LEAD_POPULATE).lean();
  const enriched = enrichLead(populated);
  invalidateDashboardCache('admin');
  notifyLeadCreated(enriched, req.user).catch(() => {});
  res.status(201).json(enriched);
});

const seedDemoLeads = asyncHandler(async (req, res) => {
  let branchId = req.branchId || req.user.branchId;
  if (!branchId) {
    const branch = await Branch.findOne({ status: 'active' }).sort({ createdAt: 1 }).select('_id');
    branchId = branch?._id;
  }
  if (!branchId) throw new ApiError(400, 'No active branch found. Create a branch first.');

  const existing = await Lead.countDocuments({ branchId, channel: 'demo_seed' });
  if (existing >= 10) {
    throw new ApiError(400, '10 demo leads already exist for this branch. Delete them first to re-seed.');
  }

  const followUpBase = new Date();
  followUpBase.setDate(followUpBase.getDate() + 1);
  followUpBase.setHours(11, 0, 0, 0);

  const created = [];
  const templates = DEMO_LEADS.slice(0, 10 - existing);

  for (let i = 0; i < templates.length; i += 1) {
    const template = templates[i];
    const travelDate = new Date();
    travelDate.setDate(travelDate.getDate() + 20 + i * 3);

    const nextFollowUp = new Date(followUpBase);
    nextFollowUp.setHours(nextFollowUp.getHours() + i);

    const typeDetection = detectLeadType(template);
    const lead = await Lead.create({
      ...template,
      status: 'new',
      leadType: typeDetection.leadType,
      leadTypeSource: typeDetection.leadTypeSource,
      travelDate,
      budgetRange: template.budget >= 100000 ? 'above_100000' : 'custom',
      leadScore: template.isHot ? 'hot' : computeLeadScoreByBudget(template.budget),
      createdBy: req.user._id,
      branchId,
      channel: 'demo_seed',
      nextFollowUp,
    });

    await createFollowUpForLead({
      body: {
        lead: lead._id,
        scheduledAt: nextFollowUp.toISOString(),
        notes: 'Demo follow-up — first contact',
        category: 'warm',
      },
      user: req.user,
    });

    created.push(lead._id);
  }

  await logActivity({
    type: 'lead_created',
    user: req.user.name,
    userId: req.user._id,
    action: `Added ${created.length} demo leads`,
    target: 'New Leads',
    ip: getClientIp(req),
    branchId,
  });

  invalidateDashboardCache('admin');

  res.status(201).json({
    message: `${created.length} demo lead(s) added to New Leads`,
    created: created.length,
    totalDemoLeads: existing + created.length,
  });
});

const updateLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({ _id: req.params.id, ...(req.branchId ? { branchId: req.branchId } : {}) });
  if (!lead) throw new ApiError(404, 'Lead not found');

  if (req.body.status && !LEAD_STATUSES.includes(req.body.status)) {
    throw new ApiError(400, 'Invalid lead status');
  }

  const prevStatus = lead.status;
  const data = normalizeLeadInput(req.body, { isUpdate: true });
  const nextStatus = data.status || lead.status;
  const effectivePayload = {
    budget: data.budget ?? lead.budget,
    nextFollowUp: data.nextFollowUp ?? lead.nextFollowUp,
  };
  if (WORKING_PIPELINE_STATUSES.includes(nextStatus)) {
    ensureLeadQualifiedForPipeline(effectivePayload);
  }
  if (data.status && LOST_LEAD_STATUSES.includes(data.status) && !data.statusReason?.trim() && !lead.statusReason?.trim()) {
    throw new ApiError(400, 'Reason is required when marking lead as lost');
  }

  Object.assign(lead, data);
  if (data.status && lead.reactivation?.isReactivated) {
    const nextStage = REACTIVATION_STATUS_TO_STAGE[data.status];
    if (nextStage) {
      setReactivationStage(lead, nextStage, req.user._id, `Status changed from ${prevStatus} to ${data.status}`);
    }
  }
  await lead.save();

  if (data.status && lead.reactivation?.isReactivated) {
    const nextStage = REACTIVATION_STATUS_TO_STAGE[data.status];
    if (nextStage) {
      notifyReactivationProgress({ lead, actor: req.user, stage: nextStage }).catch(() => {});
    }
  }

  const populated = await Lead.findById(lead._id).populate(LEAD_POPULATE).lean();
  res.json(enrichLead(populated));
});

const deleteLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({ _id: req.params.id, ...(req.branchId ? { branchId: req.branchId } : {}) });
  if (!lead) throw new ApiError(404, 'Lead not found');
  if (LOST_LEAD_STATUSES.includes(lead.status)) {
    throw new ApiError(400, 'Lost leads cannot be deleted');
  }
  await lead.deleteOne();
  res.json({ message: 'Lead deleted' });
});

const reactivateLead = asyncHandler(async (req, res) => {
  if (!['admin', 'sales_manager'].includes(req.user.role)) {
    throw new ApiError(403, 'Only Admin and Sales Manager can reactivate leads');
  }
  const lead = await Lead.findOne({ _id: req.params.id, ...(req.branchId ? { branchId: req.branchId } : {}) });
  if (!lead) throw new ApiError(404, 'Lead not found');
  if (!LOST_LEAD_STATUSES.includes(lead.status)) {
    throw new ApiError(400, 'Only lost leads can be reactivated');
  }

  const reason = (req.body.reason || '').trim();
  if (!reason) throw new ApiError(400, 'Reactivation reason is required');

  const previousStatus = lead.status;
  lead.status = 'reactivated';
  lead.statusReason = reason;
  lead.statusReasonUpdatedAt = new Date();
  lead.reactivation = lead.reactivation || {};
  lead.reactivation.isReactivated = true;
  lead.reactivation.previousLostStatus = previousStatus;
  lead.reactivation.reactivatedAt = new Date();
  lead.reactivation.reactivatedBy = req.user._id;
  lead.reactivation.reactivatedReason = reason;
  setReactivationStage(lead, 'reactivated', req.user._id, reason);

  await lead.save();
  await logActivity({
    type: 'lead_reactivated',
    user: req.user.name,
    userId: req.user._id,
    action: `Reactivated lead ${lead.leadId || lead.name}`,
    target: lead.name,
    ip: getClientIp(req),
    branchId: lead.branchId || req.branchId || null,
    meta: { leadId: lead._id, reason },
  });
  notifyLeadReactivated({ lead, actor: req.user, assigneeId: lead.assignedTo }).catch(() => {});
  const populated = await Lead.findById(lead._id).populate(LEAD_POPULATE).lean();
  res.json(enrichLead(populated));
});

const reassignReactivatedLead = asyncHandler(async (req, res) => {
  if (!['admin', 'sales_manager'].includes(req.user.role)) {
    throw new ApiError(403, 'Only Admin and Sales Manager can reassign reactivated leads');
  }
  const lead = await Lead.findOne({ _id: req.params.id, ...(req.branchId ? { branchId: req.branchId } : {}) });
  if (!lead) throw new ApiError(404, 'Lead not found');
  if (!lead.reactivation?.isReactivated || lead.status !== 'reactivated') {
    throw new ApiError(400, 'Lead is not in reactivated state');
  }

  const executiveId = req.body.executiveId;
  if (!executiveId) throw new ApiError(400, 'executiveId is required');
  const executive = await User.findOne({
    _id: executiveId,
    role: 'sales_executive',
    status: 'active',
    ...(req.branchId ? { branchId: req.branchId } : {}),
  }).select('name');
  if (!executive) throw new ApiError(404, 'Executive not found');

  lead.assignedTo = executive._id;
  lead.assigneeRole = 'sales_executive';
  lead.reactivation.reassignedTo = executive._id;
  lead.reactivation.reassignedBy = req.user._id;
  lead.reactivation.reassignedAt = new Date();
  setReactivationStage(lead, 'reassigned', req.user._id, `Assigned to ${executive.name}`);
  await lead.save();

  await logActivity({
    type: 'lead_reactivation_reassigned',
    user: req.user.name,
    userId: req.user._id,
    action: `Reassigned reactivated lead ${lead.leadId || lead.name} to ${executive.name}`,
    target: lead.name,
    ip: getClientIp(req),
    branchId: lead.branchId || req.branchId || null,
    meta: { leadId: lead._id, executiveId: executive._id },
  });
  notifyLeadReassigned({
    lead,
    actor: req.user,
    assigneeId: executive._id,
    assigneeName: executive.name,
  }).catch(() => {});

  const populated = await Lead.findById(lead._id).populate(LEAD_POPULATE).lean();
  res.json(enrichLead(populated));
});

const updateReactivationStage = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({ _id: req.params.id, ...(req.branchId ? { branchId: req.branchId } : {}) });
  if (!lead) throw new ApiError(404, 'Lead not found');
  if (!lead.reactivation?.isReactivated) throw new ApiError(400, 'Lead is not reactivated');
  const stage = req.body.stage;
  if (!REACTIVATION_STAGES.includes(stage)) throw new ApiError(400, 'Invalid reactivation stage');

  setReactivationStage(lead, stage, req.user._id, (req.body.note || '').trim());
  if (stage === 'contacted') lead.status = 'contacted';
  if (stage === 'follow_up_scheduled') lead.status = 'follow_up';
  if (stage === 'quotation_sent') lead.status = 'quotation_sent';
  if (stage === 'converted') lead.status = 'converted';
  await lead.save();

  await logActivity({
    type: 'lead_reactivation_progress',
    user: req.user.name,
    userId: req.user._id,
    action: `Updated reactivation stage to ${stage}`,
    target: lead.name,
    ip: getClientIp(req),
    branchId: lead.branchId || req.branchId || null,
    meta: { leadId: lead._id, stage },
  });
  notifyReactivationProgress({ lead, actor: req.user, stage }).catch(() => {});
  const populated = await Lead.findById(lead._id).populate(LEAD_POPULATE).lean();
  res.json(enrichLead(populated));
});

const getAssignees = asyncHandler(async (req, res) => {
  const users = await User.find({
    status: 'active',
    ...(req.branchId ? { branchId: req.branchId } : {}),
  }).select('name email role').lean();
  const mapUser = (u) => ({
    _id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    roleName: ROLE_LABELS[u.role] || u.role,
  });

  res.json({
    salesManagers: users.filter((u) => u.role === 'sales_manager').map(mapUser),
    teamLeaders: users.filter((u) => u.role === 'team_leader').map(mapUser),
    salesExecutives: users.filter((u) => u.role === 'sales_executive').map(mapUser),
  });
});

const assignLeads = asyncHandler(async (req, res) => {
  const { leadIds, assigneeRole, assigneeId } = req.body;
  const ids = leadIds || (req.body.leadId ? [req.body.leadId] : []);

  if (!ids.length) throw new ApiError(400, 'No leads selected');

  const assignee = await User.findOne({
    _id: assigneeId,
    ...(req.branchId ? { branchId: req.branchId } : {}),
  }).select('name email role');
  if (!assignee) throw new ApiError(404, 'Assignee not found');

  const patch = { assigneeRole };

  if (assigneeRole === 'sales_manager') {
    patch.assignedManager = assignee._id;
    patch.assignedTeamLeader = null;
    patch.assignedTo = assignee._id;
  } else if (assigneeRole === 'team_leader') {
    patch.assignedTeamLeader = assignee._id;
    patch.assignedTo = assignee._id;
  } else if (assigneeRole === 'sales_executive') {
    patch.assignedTo = assignee._id;
  } else {
    throw new ApiError(400, 'Invalid assignee role');
  }

  await Lead.updateMany({ _id: { $in: ids }, ...(req.branchId ? { branchId: req.branchId } : {}) }, patch);

  await logActivity({
    type: 'lead_assigned',
    user: req.user.name,
    userId: req.user._id,
    action: `Assigned ${ids.length} lead(s) to ${assignee.name}`,
    target: assignee.name,
    ip: getClientIp(req),
    branchId: req.branchId || req.user.branchId || null,
  });

  notifyLeadAssigned({
    assigneeId: assignee._id,
    assigneeName: assignee.name,
    leadIds: ids,
    assignedBy: req.user,
  }).catch(() => {});

  res.json({
    message: 'Leads assigned',
    count: ids.length,
    assignee: assignee.name,
    role: assigneeRole,
  });
});

const transferLeadBranch = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new ApiError(403, 'Only admin can transfer lead branch');
  }

  const targetBranchId = String(req.body.branchId || '').trim();
  if (!targetBranchId) throw new ApiError(400, 'branchId is required');

  const lead = await Lead.findOne({ _id: req.params.id, ...(req.branchId ? { branchId: req.branchId } : {}) });
  if (!lead) throw new ApiError(404, 'Lead not found');

  const targetBranch = await Branch.findById(targetBranchId).select('name status');
  if (!targetBranch || targetBranch.status !== 'active') {
    throw new ApiError(404, 'Target branch not found or inactive');
  }
  if (String(lead.branchId || '') === String(targetBranch._id)) {
    throw new ApiError(400, 'Lead is already in selected branch');
  }

  lead.branchId = targetBranch._id;
  lead.assignedTo = null;
  lead.assignedManager = null;
  lead.assignedTeamLeader = null;
  lead.assigneeRole = null;
  await lead.save();

  await logActivity({
    type: 'lead_branch_transferred',
    user: req.user.name,
    userId: req.user._id,
    action: `Transferred lead ${lead.leadId || lead.name} to branch ${targetBranch.name}`,
    target: lead.name,
    ip: getClientIp(req),
    branchId: targetBranch._id,
    meta: { leadId: lead._id, targetBranchId: targetBranch._id },
  });

  const populated = await Lead.findById(lead._id).populate(LEAD_POPULATE).lean();
  res.json(enrichLead(populated));
});

const addLeadNote = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) throw new ApiError(400, 'Note text is required');

  const lead = await Lead.findOne({ _id: req.params.id, ...(req.branchId ? { branchId: req.branchId } : {}) });
  if (!lead) throw new ApiError(404, 'Lead not found');

  const note = await LeadNote.create({
    lead: lead._id,
    text: text.trim(),
    user: req.user._id,
  });

  const stamp = new Date().toISOString();
  lead.notes = `${lead.notes || ''}\n[${stamp}] ${text.trim()}`.trim();
  await lead.save();

  const populated = await LeadNote.findById(note._id).populate('user', 'name email').lean();

  parseAndNotifyMentions(text, req.user, `lead ${lead.name}`, {
    leadId: lead._id,
    branchId: lead.branchId || req.branchId || null,
    mentionIds: req.body.mentions,
  }).catch(() => {});

  res.status(201).json({
    date: stamp,
    text: text.trim(),
    user: populated.user?.name || req.user.name,
    _id: populated._id,
  });
});

module.exports = {
  listLeads,
  listLostLeads,
  getLead,
  createLead,
  seedDemoLeads,
  updateLead,
  deleteLead,
  getAssignees,
  assignLeads,
  transferLeadBranch,
  addLeadNote,
  reactivateLead,
  reassignReactivatedLead,
  updateReactivationStage,
};
