/**
 * Real-time / scheduled CRM notifications (follow-up reminders, SLA, toasts).
 * To turn back on: set NOTIFICATIONS_ENABLED=true in backend/.env
 */
const NOTIFICATIONS_ENABLED = process.env.NOTIFICATIONS_ENABLED === 'true';

module.exports = { NOTIFICATIONS_ENABLED };
