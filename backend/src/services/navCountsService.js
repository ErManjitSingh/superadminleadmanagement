const Lead = require('../models/Lead');
const FollowUp = require('../models/FollowUp');
const Quotation = require('../models/Quotation');
const Package = require('../models/Package');
const Notification = require('../models/Notification');
const Booking = require('../models/Booking');
const SupportTicket = require('../models/SupportTicket');
const { getExecutiveIdsForLeader } = require('./teamScopeService');
const { withBranch } = require('../utils/branchScope');

function todayRange() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  return { startOfToday, endOfToday };
}

async function countHotLeads(extra = {}, branchId = null) {
  return Lead.countDocuments({
    ...withBranch(extra, branchId),
    isHot: true,
    status: { $nin: ['converted', 'lost', 'booked_from_another_company'] },
  });
}

async function countFollowUpsDue(extra = {}, branchId = null) {
  const { endOfToday } = todayRange();
  return FollowUp.countDocuments({
    ...withBranch(extra, branchId),
    status: 'pending',
    scheduledAt: { $lte: endOfToday },
  });
}

async function countFollowUpsToday(extra = {}, branchId = null) {
  const { startOfToday, endOfToday } = todayRange();
  return FollowUp.countDocuments({
    ...withBranch(extra, branchId),
    status: 'pending',
    scheduledAt: { $gte: startOfToday, $lte: endOfToday },
  });
}

async function unreadNotifications(userId, branchId = null) {
  return Notification.countDocuments(withBranch({ user: userId, read: false }, branchId));
}

function facetCount(facet, key) {
  return facet?.[key]?.[0]?.n ?? 0;
}

/** Single aggregation for lead sidebar counts — replaces 7 separate countDocuments */
async function aggregateAdminLeadCounts(branchId) {
  const match = withBranch({ isDeleted: { $ne: true } }, branchId);
  const { startOfToday, endOfToday } = todayRange();
  const [row] = await Lead.aggregate([
    { $match: match },
    {
      $facet: {
        all: [{ $count: 'n' }],
        new: [
          { $match: { createdAt: { $gte: startOfToday, $lte: endOfToday } } },
          { $count: 'n' },
        ],
        unassigned: [{ $match: { assignedTo: null } }, { $count: 'n' }],
        assigned: [{ $match: { assignedTo: { $ne: null } } }, { $count: 'n' }],
        converted: [{ $match: { status: 'converted' } }, { $count: 'n' }],
        lost: [{ $match: { status: { $in: ['lost', 'booked_from_another_company'] } } }, { $count: 'n' }],
        whatsapp: [{ $match: { source: 'whatsapp' } }, { $count: 'n' }],
      },
    },
  ]);

  return {
    all: facetCount(row, 'all'),
    new: facetCount(row, 'new'),
    unassigned: facetCount(row, 'unassigned'),
    assigned: facetCount(row, 'assigned'),
    converted: facetCount(row, 'converted'),
    lost: facetCount(row, 'lost'),
    whatsapp: facetCount(row, 'whatsapp'),
  };
}

async function buildAdminNavCounts(userId, { branchId } = {}) {
  const [
    leads,
    followUpsTotal,
    followUpsDue,
    customers,
    quotationsTotal,
    quotationsPending,
    packages,
    notificationsUnread,
    calendarToday,
  ] = await Promise.all([
    aggregateAdminLeadCounts(branchId),
    FollowUp.countDocuments(withBranch({ status: 'pending' }, branchId)),
    countFollowUpsDue({}, branchId),
    Lead.countDocuments({
      $or: [{ status: 'converted' }, { isRepeatCustomer: true }],
    }),
    Quotation.countDocuments(withBranch({}, branchId)),
    Quotation.countDocuments(withBranch({ status: 'pending_approval' }, branchId)),
    Package.countDocuments(),
    unreadNotifications(userId, branchId),
    countFollowUpsToday({}, branchId),
  ]);

  return {
    leads,
    followups: { total: followUpsTotal, due: followUpsDue },
    customers,
    quotations: { total: quotationsTotal, pending: quotationsPending },
    packages,
    notifications: { unread: notificationsUnread },
    calendar: { today: calendarToday },
  };
}

async function buildSalesManagerNavCounts(userId, { branchId } = {}) {
  const [
    leadsAll,
    leadsUnassigned,
    leadsAssigned,
    leadsHot,
    leadsLost,
    leadsReactivated,
    followUpsDue,
    quotationsPending,
    quotationsApproved,
    quotationsRejected,
    notificationsUnread,
    calendarToday,
  ] = await Promise.all([
    Lead.countDocuments(withBranch({}, branchId)),
    Lead.countDocuments(withBranch({ assignedTo: null }, branchId)),
    Lead.countDocuments(withBranch({ assignedTo: { $ne: null } }, branchId)),
    countHotLeads({}, branchId),
    Lead.countDocuments(withBranch({ status: { $in: ['lost', 'booked_from_another_company'] } }, branchId)),
    Lead.countDocuments(withBranch({ 'reactivation.isReactivated': true }, branchId)),
    countFollowUpsDue({}, branchId),
    Quotation.countDocuments(withBranch({ status: { $in: ['sent', 'negotiation', 'pending_approval'] } }, branchId)),
    Quotation.countDocuments(withBranch({ status: 'approved' }, branchId)),
    Quotation.countDocuments(withBranch({ status: 'rejected' }, branchId)),
    unreadNotifications(userId, branchId),
    countFollowUpsToday({}, branchId),
  ]);

  return {
    leads: {
      all: leadsAll,
      unassigned: leadsUnassigned,
      assigned: leadsAssigned,
      hot: leadsHot,
      lost: leadsLost,
      reactivated: leadsReactivated,
    },
    assignment: leadsUnassigned,
    followups: { due: followUpsDue },
    quotations: {
      pending: quotationsPending,
      approved: quotationsApproved,
      rejected: quotationsRejected,
    },
    notifications: { unread: notificationsUnread },
    calendar: { today: calendarToday },
  };
}

async function buildExecutiveNavCounts(userId, { branchId } = {}) {
  const base = withBranch({ assignedTo: userId }, branchId);
  const leadIds = await Lead.find(base).distinct('_id');

  const [
    leadsAll,
    leadsNew,
    leadsContacted,
    leadsFollowUp,
    leadsHot,
    leadsConverted,
    leadsLost,
    leadsReactivated,
    followUpsDue,
    quotationsTotal,
    customers,
    notificationsUnread,
  ] = await Promise.all([
    Lead.countDocuments(base),
    Lead.countDocuments({ ...base, status: 'new' }),
    Lead.countDocuments({ ...base, status: 'contacted' }),
    Lead.countDocuments({ ...base, status: { $in: ['follow_up', 'negotiation'] } }),
    countHotLeads(base, branchId),
    Lead.countDocuments({ ...base, status: 'converted' }),
    Lead.countDocuments({ ...base, status: { $in: ['lost', 'booked_from_another_company'] } }),
    Lead.countDocuments({
      ...base,
      'reactivation.isReactivated': true,
      status: 'reactivated',
    }),
    countFollowUpsDue({ assignedTo: userId }, branchId),
    leadIds.length
      ? Quotation.countDocuments({
          $or: [{ createdByExecutive: userId }, { lead: { $in: leadIds } }],
        })
      : 0,
    Lead.countDocuments({
      ...base,
      $or: [{ status: 'converted' }, { isRepeatCustomer: true }],
    }),
    unreadNotifications(userId, branchId),
  ]);

  return {
    leads: {
      all: leadsAll,
      new: leadsNew,
      contacted: leadsContacted,
      followUp: leadsFollowUp,
      hot: leadsHot,
      converted: leadsConverted,
      lost: leadsLost,
      reactivated: leadsReactivated,
    },
    followups: { due: followUpsDue },
    quotations: { total: quotationsTotal },
    customers,
    notifications: { unread: notificationsUnread },
  };
}

async function buildTeamLeaderNavCounts(userId, { branchId } = {}) {
  const execIds = await getExecutiveIdsForLeader(userId);
  const squadFilter = withBranch(execIds.length ? { assignedTo: { $in: execIds } } : { assignedTo: null }, branchId);
  const leadIds = execIds.length
    ? await Lead.find(squadFilter).distinct('_id')
    : [];
  const quoteFilter = leadIds.length ? { lead: { $in: leadIds } } : { lead: null };

  const fiveDaysAgo = new Date(Date.now() - 5 * 86400000);
  const [stuckIds, highValueIds] = await Promise.all([
    Lead.find({
      ...squadFilter,
      status: { $in: ['follow_up', 'negotiation', 'quotation_sent'] },
      updatedAt: { $lt: fiveDaysAgo },
    }).distinct('_id'),
    Lead.find({
      ...squadFilter,
      budget: { $gte: 200000 },
      status: { $nin: ['converted', 'lost', 'booked_from_another_company'] },
    }).distinct('_id'),
  ]);
  const escalations = new Set([
    ...stuckIds.map(String),
    ...highValueIds.map(String),
  ]).size;

  const squadFollowFilter = execIds.length
    ? { assignedTo: { $in: execIds } }
    : { assignedTo: null };

  const [
    leadsAll,
    leadsLost,
    leadsReactivated,
    followUpsDue,
    quotationsPending,
    quotationsNegotiation,
    quotationsApproved,
    quotationsRejected,
    notificationsUnread,
  ] = await Promise.all([
    Lead.countDocuments(squadFilter),
    Lead.countDocuments({
      ...squadFilter,
      status: { $in: ['lost', 'booked_from_another_company'] },
    }),
    Lead.countDocuments({ ...squadFilter, 'reactivation.isReactivated': true }),
    countFollowUpsDue(squadFollowFilter, branchId),
    Quotation.countDocuments(withBranch({ ...quoteFilter, status: 'pending_approval' }, branchId)),
    Quotation.countDocuments(withBranch({ ...quoteFilter, status: 'negotiation' }, branchId)),
    Quotation.countDocuments(withBranch({ ...quoteFilter, status: 'approved' }, branchId)),
    Quotation.countDocuments(withBranch({ ...quoteFilter, status: 'rejected' }, branchId)),
    unreadNotifications(userId, branchId),
  ]);

  return {
    leads: { all: leadsAll, lost: leadsLost, reactivated: leadsReactivated },
    followups: { due: followUpsDue },
    escalations,
    quotations: {
      pending: quotationsPending,
      negotiation: quotationsNegotiation,
      approved: quotationsApproved,
      rejected: quotationsRejected,
    },
    notifications: { unread: notificationsUnread },
  };
}

async function buildOperationsNavCounts(userId, { branchId } = {}) {
  const [
    bookingsPending,
    bookingsConfirmed,
    bookingsActive,
    bookingsCompleted,
    supportOpen,
    notificationsUnread,
  ] = await Promise.all([
    Booking.countDocuments(withBranch({ status: 'pending' }, branchId)),
    Booking.countDocuments(withBranch({ status: 'confirmed' }, branchId)),
    Booking.countDocuments(withBranch({ status: 'in_progress' }, branchId)),
    Booking.countDocuments(withBranch({ status: 'completed' }, branchId)),
    SupportTicket.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
    unreadNotifications(userId, branchId),
  ]);

  return {
    bookings: {
      pending: bookingsPending,
      confirmed: bookingsConfirmed,
      active: bookingsActive,
      completed: bookingsCompleted,
    },
    support: { open: supportOpen },
    notifications: { unread: notificationsUnread },
  };
}

async function buildNavCounts(user, { branchId } = {}) {
  const role = user?.role || 'admin';
  const userId = user._id;

  switch (role) {
    case 'sales_manager':
      return buildSalesManagerNavCounts(userId, { branchId });
    case 'sales_executive':
      return buildExecutiveNavCounts(userId, { branchId });
    case 'team_leader':
      return buildTeamLeaderNavCounts(userId, { branchId });
    case 'operations_manager':
      return buildOperationsNavCounts(userId, { branchId });
    case 'admin':
    case 'manager':
    case 'accountant':
    default:
      return buildAdminNavCounts(userId, { branchId });
  }
}

module.exports = { buildNavCounts };
