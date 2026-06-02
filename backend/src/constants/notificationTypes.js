/** Notification event types — keep in sync with frontend notificationMeta */
const NOTIFICATION_TYPES = {
  LEAD_CREATED: 'lead_created',
  LEAD_ASSIGNED: 'lead_assigned',
  LEAD_REACTIVATED: 'lead_reactivated',
  LEAD_REASSIGNED: 'lead_reassigned',
  LEAD_REACTIVATION_PROGRESS: 'lead_reactivation_progress',
  FOLLOWUP_REMINDER: 'followup_reminder',
  FOLLOWUP_MISSED: 'followup_missed',
  QUOTATION_CREATED: 'quotation_created',
  QUOTATION_APPROVED: 'quotation_approved',
  QUOTATION_REJECTED: 'quotation_rejected',
  BOOKING_CONFIRMED: 'booking_confirmed',
  PAYMENT_RECEIVED: 'payment_received',
  USER_MENTIONED: 'user_mentioned',
};

module.exports = { NOTIFICATION_TYPES };
