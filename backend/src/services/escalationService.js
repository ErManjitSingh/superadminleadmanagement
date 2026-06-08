const FollowUp = require('../models/FollowUp');
const LeadEscalation = require('../models/LeadEscalation');
const { logLeadActivity } = require('./leadActivityService');
const { notifyFollowUpEscalation } = require('./notificationService');

const LEVELS = [
  { key: '15m', minutes: 15, roles: ['team_leader'] },
  { key: '30m', minutes: 30, roles: ['sales_manager'] },
  { key: '1h', minutes: 60, roles: ['admin', 'sales_manager'] },
];

async function processFollowUpEscalations() {
  const now = Date.now();
  const overdue = await FollowUp.find({
    status: 'pending',
    scheduledAt: { $lt: new Date(now) },
  })
    .populate('lead', 'name branchId assignedTo')
    .populate('assignedTo', 'name')
    .lean();

  for (const fu of overdue) {
    const overdueMs = now - new Date(fu.scheduledAt).getTime();
    const overdueMin = Math.floor(overdueMs / 60000);

    for (const level of LEVELS) {
      if (overdueMin < level.minutes) continue;

      const exists = await LeadEscalation.findOne({ followUpId: fu._id, level: level.key }).select('_id');
      if (exists) continue;

      await LeadEscalation.create({
        leadId: fu.lead?._id || fu.lead,
        followUpId: fu._id,
        branchId: fu.branchId || fu.lead?.branchId,
        level: level.key,
        minutesOverdue: overdueMin,
        notifiedRoles: level.roles,
        meta: { leadName: fu.lead?.name, executiveName: fu.assignedTo?.name },
      });

      await logLeadActivity({
        leadId: fu.lead?._id || fu.lead,
        branchId: fu.branchId,
        type: 'escalation_created',
        description: `Follow-up overdue by ${overdueMin} min — escalated (${level.key})`,
        actor: { name: 'System' },
        meta: { followUpId: fu._id, level: level.key },
      });

      await notifyFollowUpEscalation({
        followUp: fu,
        lead: fu.lead,
        level: level.key,
        minutesOverdue: overdueMin,
        notifyRoles: level.roles,
      });
    }
  }
}

module.exports = { processFollowUpEscalations, LEVELS };
