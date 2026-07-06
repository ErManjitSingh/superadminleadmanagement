const FollowUp = require('../models/FollowUp');
const Lead = require('../models/Lead');
const Notification = require('../models/Notification');
const { NOTIFICATION_TYPES } = require('../constants/notificationTypes');
const {
  notifyFollowUpReminder,
  notifyFollowUpMissed,
} = require('./notificationService');
const { processFollowUpEscalations } = require('./escalationService');
const { processSlaBreaches } = require('./slaService');
const { startOfDay } = require('../utils/queryHelpers');

const REMINDER_WINDOW_MS = 15 * 60 * 1000;
const TICK_MS = 60 * 1000;

async function alreadyNotified(userId, type, followUpId, withinMs = null) {
  const followUpIdStr = followUpId?.toString?.() || `${followUpId}`;
  const query = {
    user: userId,
    type,
    'meta.followUpId': { $in: [followUpId, followUpIdStr] },
  };
  if (withinMs) {
    query.createdAt = { $gte: new Date(Date.now() - withinMs) };
  }
  const exists = await Notification.findOne(query).select('_id');
  return !!exists;
}

async function processFollowUpReminders() {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_MS);

  const dueSoon = await FollowUp.find({
    status: 'pending',
    scheduledAt: { $gte: now, $lte: windowEnd },
  })
    .populate('lead', 'name assignedTo')
    .populate('assignedTo', 'name _id')
    .lean();

  for (const fu of dueSoon) {
    const userId = fu.assignedTo?._id || fu.lead?.assignedTo;
    if (!userId) continue;
    if (await alreadyNotified(userId, NOTIFICATION_TYPES.FOLLOWUP_REMINDER, fu._id, 24 * 60 * 60 * 1000)) continue;
    await notifyFollowUpReminder(fu, fu.lead);
  }
}

async function processMissedFollowUps() {
  const todayStart = startOfDay();

  await FollowUp.updateMany(
    { status: 'pending', scheduledAt: { $lt: todayStart } },
    { status: 'missed' }
  );

  const missed = await FollowUp.find({
    status: 'missed',
    scheduledAt: { $lt: todayStart },
  })
    .populate('lead', 'name assignedTo')
    .populate('assignedTo', 'name _id')
    .lean();

  for (const fu of missed) {
    const execId = fu.assignedTo?._id || fu.lead?.assignedTo;
    // Missed alert is persistent; send only once until follow-up is rescheduled/added.
    if (execId) {
      if (await alreadyNotified(execId, NOTIFICATION_TYPES.FOLLOWUP_MISSED, fu._id)) continue;
    } else {
      const followUpIdStr = fu._id?.toString?.() || `${fu._id}`;
      const exists = await Notification.findOne({
        type: NOTIFICATION_TYPES.FOLLOWUP_MISSED,
        'meta.followUpId': { $in: [fu._id, followUpIdStr] },
      }).select('_id');
      if (exists) continue;
    }
    await notifyFollowUpMissed(fu, fu.lead);
  }
}

function startNotificationScheduler() {
  const { processPaymentReminders } = require('./paymentReminderService');

  const tick = async () => {
    try {
      await processFollowUpReminders();
      await processMissedFollowUps();
      await processFollowUpEscalations();
      await processSlaBreaches();
      await processPaymentReminders();
    } catch (err) {
      console.error('[NotificationScheduler]', err.message);
    }
  };

  tick();
  const handle = setInterval(tick, TICK_MS);
  console.log('[NotificationScheduler] Started (reminders, missed & escalations)');
  return () => clearInterval(handle);
}

module.exports = { startNotificationScheduler };
