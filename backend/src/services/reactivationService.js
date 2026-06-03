const { REACTIVATION_STAGES } = require('../models/Lead');

function setReactivationStage(lead, stage, byUserId, note = '') {
  if (!REACTIVATION_STAGES.includes(stage)) return;
  lead.reactivation = lead.reactivation || {};
  lead.reactivation.isReactivated = true;
  lead.reactivation.stage = stage;
  lead.reactivation.stageUpdatedAt = new Date();
  const history = Array.isArray(lead.reactivation.stageHistory) ? lead.reactivation.stageHistory : [];
  history.push({ stage, by: byUserId, at: new Date(), note: note || '' });
  lead.reactivation.stageHistory = history;
}

/** When executive schedules follow-up on a reactivated lead, move back into active pipeline. */
function promoteReactivatedLeadOnFollowUp(lead, actorId) {
  if (lead.status !== 'reactivated' || !lead.reactivation?.isReactivated) return false;
  lead.status = 'follow_up';
  setReactivationStage(lead, 'follow_up_scheduled', actorId, 'Follow-up added — lead active again');
  return true;
}

module.exports = {
  setReactivationStage,
  promoteReactivatedLeadOnFollowUp,
};
