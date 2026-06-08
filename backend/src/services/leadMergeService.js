const Lead = require('../models/Lead');
const FollowUp = require('../models/FollowUp');
const LeadNote = require('../models/LeadNote');
const Quotation = require('../models/Quotation');
const CallNote = require('../models/CallNote');
const LeadActivity = require('../models/LeadActivity');
const WhatsAppMessage = require('../models/WhatsAppMessage');
const WhatsAppNote = require('../models/WhatsAppNote');
const LeadMergeLog = require('../models/LeadMergeLog');
const ApiError = require('../utils/apiError');
const { logLeadActivity } = require('./leadActivityService');
const { logAudit } = require('./leadAuditService');
const { applyLeadMetrics } = require('./leadScoringService');
const { notifyLeadMerged } = require('./notificationService');

const STATUS_RANK = {
  new: 0,
  contacted: 1,
  working_progress: 2,
  follow_up: 3,
  quotation_sent: 4,
  negotiation: 5,
  reactivated: 6,
  converted: 7,
  lost: -1,
  booked_from_another_company: -1,
};

function pickAdvancedStatus(a, b) {
  const ra = STATUS_RANK[a] ?? 0;
  const rb = STATUS_RANK[b] ?? 0;
  return ra >= rb ? a : b;
}

async function reassignRelatedDocs(Model, sourceId, targetId, field = 'lead') {
  const filter = { [field]: sourceId };
  const count = await Model.countDocuments(filter);
  if (count) await Model.updateMany(filter, { [field]: targetId });
  return count;
}

async function mergeLeads({ sourceLeadId, targetLeadId, actor, branchId, ip }) {
  if (String(sourceLeadId) === String(targetLeadId)) {
    throw new ApiError(400, 'Cannot merge a lead into itself');
  }

  const scope = branchId ? { branchId } : {};
  const [source, target] = await Promise.all([
    Lead.findOne({ _id: sourceLeadId, ...scope, isDeleted: { $ne: true } }),
    Lead.findOne({ _id: targetLeadId, ...scope, isDeleted: { $ne: true } }),
  ]);

  if (!source) throw new ApiError(404, 'Source lead not found');
  if (!target) throw new ApiError(404, 'Target lead not found');

  const sourceSnapshot = {
    leadId: source.leadId,
    name: source.name,
    phone: source.phone,
    email: source.email,
    status: source.status,
    budget: source.budget,
  };

  const moved = {
    followUps: await reassignRelatedDocs(FollowUp, source._id, target._id),
    notes: await reassignRelatedDocs(LeadNote, source._id, target._id),
    quotations: await reassignRelatedDocs(Quotation, source._id, target._id),
    callNotes: await reassignRelatedDocs(CallNote, source._id, target._id, 'leadId'),
    whatsappMessages: await reassignRelatedDocs(WhatsAppMessage, source._id, target._id),
    whatsappNotes: await reassignRelatedDocs(WhatsAppNote, source._id, target._id),
    activities: await LeadActivity.updateMany({ leadId: source._id }, { leadId: target._id }).then(
      (r) => r.modifiedCount
    ),
  };

  if (source.notes?.trim()) {
    const stamp = new Date().toISOString().slice(0, 10);
    target.notes = [target.notes, `[Merged ${stamp} from ${source.name}]`, source.notes]
      .filter(Boolean)
      .join('\n')
      .trim();
  }
  if (!target.alternatePhone && source.alternatePhone) target.alternatePhone = source.alternatePhone;
  if (!target.email && source.email) target.email = source.email;
  if ((source.budget || 0) > (target.budget || 0)) target.budget = source.budget;
  target.status = pickAdvancedStatus(target.status, source.status);
  if (!target.firstContactAt && source.firstContactAt) target.firstContactAt = source.firstContactAt;

  await applyLeadMetrics(target);
  await target.save();

  source.isDeleted = true;
  source.deletedAt = new Date();
  source.deletedBy = actor._id;
  await source.save();

  await LeadMergeLog.create({
    sourceLeadId: source._id,
    targetLeadId: target._id,
    branchId: target.branchId,
    mergedBy: actor._id,
    sourceSnapshot,
    meta: { moved },
  });

  await logLeadActivity({
    leadId: target._id,
    branchId: target.branchId,
    type: 'lead_merged',
    description: `Merged duplicate lead ${source.name} (${source.phone}) into this record`,
    actor,
    meta: { sourceLeadId: source._id, moved },
  });
  await logAudit({
    entityType: 'lead',
    entityId: target._id,
    branchId: target.branchId,
    action: 'lead.merged',
    actor,
    ip,
    meta: { sourceLeadId: source._id, sourceSnapshot },
  });

  notifyLeadMerged({ target, source, actor }).catch(() => {});

  return { target, source, moved };
}

module.exports = { mergeLeads };
