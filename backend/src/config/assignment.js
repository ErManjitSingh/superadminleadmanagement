/**
 * Master switch for automatic lead assignment when a lead is created.
 * Manual assignment (admin / sales manager / team leader) is always available.
 *
 * To turn auto-assignment back on: set LEAD_AUTO_ASSIGNMENT_ENABLED=true in backend/.env
 * or change the default below to true.
 */
const LEAD_AUTO_ASSIGNMENT_ENABLED = process.env.LEAD_AUTO_ASSIGNMENT_ENABLED === 'true';

module.exports = { LEAD_AUTO_ASSIGNMENT_ENABLED };
