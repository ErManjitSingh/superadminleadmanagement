const Lead = require('../models/Lead');
const User = require('../models/User');
const Team = require('../models/Team');
const Attendance = require('../models/Attendance');
const Destination = require('../models/Destination');
const UserDestination = require('../models/UserDestination');
const BranchAssignmentSettings = require('../models/BranchAssignmentSettings');
const LeadAssignmentLog = require('../models/LeadAssignmentLog');
const AssignmentRoundRobin = require('../models/AssignmentRoundRobin');
const { normalizeDestinationKey } = require('../models/Destination');
const { startOfCalendarDay } = require('./attendanceService');
const { notifyLeadAssigned } = require('./notificationService');

const ACTIVE_LEAD_STATUSES = [
  'new',
  'contacted',
  'working_progress',
  'follow_up',
  'quotation_sent',
  'negotiation',
  'reactivated',
];

const DEFAULT_DESTINATIONS = [
  { name: 'Manali', aliases: ['Manali Himachal'] },
  { name: 'Shimla', aliases: ['Shimla Himachal'] },
  { name: 'Kasol', aliases: ['Kasol Valley'] },
  { name: 'Kashmir', aliases: ['Srinagar', 'Jammu Kashmir'] },
  { name: 'Leh Ladakh', aliases: ['Ladakh', 'Leh'] },
  { name: 'Goa', aliases: [] },
  { name: 'Kerala', aliases: ['God\'s Own Country'] },
  { name: 'Himachal Pradesh', aliases: ['Himachal'] },
  { name: 'Uttarakhand', aliases: [] },
  { name: 'Rajasthan', aliases: ['Jaipur', 'Udaipur'] },
  { name: 'Andaman', aliases: ['Andaman Islands'] },
  { name: 'Dubai', aliases: [] },
  { name: 'Thailand', aliases: ['Bangkok'] },
  { name: 'Maldives', aliases: [] },
];

async function ensureDefaultDestinations() {
  for (const item of DEFAULT_DESTINATIONS) {
    const normalizedKey = normalizeDestinationKey(item.name);
    const exists = await Destination.findOne({ normalizedKey }).select('_id');
    if (exists) continue;
    await Destination.create({
      name: item.name,
      normalizedKey,
      aliases: item.aliases || [],
      status: 'active',
    });
  }
}

async function resolveDestination(leadDestination) {
  const raw = String(leadDestination || '').trim();
  if (!raw || raw.toLowerCase() === 'not specified') return null;

  const leadKey = normalizeDestinationKey(raw);
  const destinations = await Destination.find({ status: 'active' }).lean();

  let best = null;
  let bestScore = 0;

  for (const dest of destinations) {
    const keys = [
      dest.normalizedKey,
      ...((dest.aliases || []).map((a) => normalizeDestinationKey(a))),
    ].filter(Boolean);

    for (const key of keys) {
      if (leadKey === key) {
        return dest;
      }
      if (leadKey.includes(key) || key.includes(leadKey)) {
        const score = Math.min(leadKey.length, key.length);
        if (score > bestScore) {
          bestScore = score;
          best = dest;
        }
      }
    }
  }

  return best;
}

async function countActiveLeadsForUser(userId, branchId) {
  return Lead.countDocuments({
    assignedTo: userId,
    status: { $in: ACTIVE_LEAD_STATUSES },
    ...(branchId ? { branchId } : {}),
  });
}

async function getPresentUserIds(userIds, branchId) {
  if (!userIds.length) return new Set();
  const dayStart = startOfCalendarDay();
  const rows = await Attendance.find({
    userId: { $in: userIds },
    date: dayStart,
    status: { $in: ['present', 'late'] },
    ...(branchId ? { branchId } : {}),
  })
    .select('userId')
    .lean();

  return new Set(rows.map((r) => String(r.userId)));
}

async function getBranchSettings(branchId) {
  if (!branchId) return null;
  let settings = await BranchAssignmentSettings.findOne({ branchId });
  if (!settings) {
    settings = await BranchAssignmentSettings.create({
      branchId,
      autoAssignEnabled: true,
      fallbackUserIds: [],
    });
  }
  return settings;
}

async function getDestinationSpecialists(destinationId, branchId) {
  const mappings = await UserDestination.find({
    destinationId,
    ...(branchId ? { branchId } : {}),
  })
    .select('userId')
    .lean();

  const userIds = mappings.map((m) => m.userId);
  if (!userIds.length) return [];

  return User.find({
    _id: { $in: userIds },
    role: 'sales_executive',
    status: 'active',
    ...(branchId ? { branchId } : {}),
  })
    .select('name email role teamId branchId')
    .lean();
}

async function getFallbackExecutives(branchId, settings) {
  const ids = settings?.fallbackUserIds || [];
  if (!ids.length) {
    return User.find({
      role: 'sales_executive',
      status: 'active',
      ...(branchId ? { branchId } : {}),
    })
      .select('name email role teamId branchId')
      .lean();
  }

  return User.find({
    _id: { $in: ids },
    role: 'sales_executive',
    status: 'active',
    ...(branchId ? { branchId } : {}),
  })
    .select('name email role teamId branchId')
    .lean();
}

async function advanceRoundRobin(key, poolLength) {
  const state = await AssignmentRoundRobin.findOneAndUpdate(
    { key },
    { $setOnInsert: { key, lastIndex: -1 } },
    { upsert: true, new: true }
  );
  const nextIndex = (state.lastIndex + 1) % poolLength;
  state.lastIndex = nextIndex;
  await state.save();
  return nextIndex;
}

async function pickExecutive(candidates, { branchId, destinationId, poolType }) {
  if (!candidates.length) return null;

  const enriched = await Promise.all(
    candidates.map(async (user) => ({
      user,
      activeLeadCount: await countActiveLeadsForUser(user._id, branchId),
    }))
  );

  const minCount = Math.min(...enriched.map((c) => c.activeLeadCount));
  const tied = enriched.filter((c) => c.activeLeadCount === minCount);

  if (tied.length === 1) {
    return {
      executive: tied[0].user,
      activeLeadCount: tied[0].activeLeadCount,
      tieBreaker: 'lowest_lead_count',
      candidates: enriched.map((c) => ({
        userId: c.user._id,
        name: c.user.name,
        activeLeadCount: c.activeLeadCount,
      })),
    };
  }

  const sorted = tied.sort((a, b) => String(a.user._id).localeCompare(String(b.user._id)));
  const rrKey = `${branchId}:${poolType}:${destinationId || 'fallback'}`;
  const index = await advanceRoundRobin(rrKey, sorted.length);
  const picked = sorted[index];

  return {
    executive: picked.user,
    activeLeadCount: picked.activeLeadCount,
    tieBreaker: 'round_robin',
    roundRobinIndex: index,
    candidates: enriched.map((c) => ({
      userId: c.user._id,
      name: c.user.name,
      activeLeadCount: c.activeLeadCount,
    })),
  };
}

async function filterEligibleExecutives(executives, branchId) {
  const presentIds = await getPresentUserIds(
    executives.map((e) => e._id),
    branchId
  );

  return executives.filter((e) => presentIds.has(String(e._id)));
}

async function applyAssignmentToLead(lead, executive) {
  lead.assignedTo = executive._id;
  lead.assigneeRole = 'sales_executive';

  if (executive.teamId) {
    const team = await Team.findById(executive.teamId).select('teamLeader').lean();
    if (team?.teamLeader) {
      lead.teamId = executive.teamId;
      lead.assignedTeamLeader = team.teamLeader;
    }
  }

  await lead.save();
}

async function writeAssignmentLog({
  lead,
  branchId,
  destination,
  assignedTo,
  assigneeName,
  assignmentType,
  success,
  reason,
  ruleSnapshot,
  triggeredBy,
}) {
  return LeadAssignmentLog.create({
    leadId: lead._id,
    branchId: branchId || lead.branchId,
    leadDestination: lead.destination,
    destinationId: destination?._id || null,
    destinationName: destination?.name || null,
    assignedTo: assignedTo || null,
    assigneeName: assigneeName || null,
    assignmentType,
    success,
    reason,
    ruleSnapshot,
    triggeredBy: triggeredBy || null,
  });
}

async function autoAssignLead(lead, { triggeredBy } = {}) {
  const branchId = lead.branchId;
  if (!branchId) {
    await writeAssignmentLog({
      lead,
      branchId: null,
      assignmentType: 'unassigned',
      success: false,
      reason: 'Lead has no branch; cannot auto-assign',
      ruleSnapshot: {},
      triggeredBy,
    });
    return { assigned: false, reason: 'no_branch' };
  }

  const settings = await getBranchSettings(branchId);
  if (settings && settings.autoAssignEnabled === false) {
    await writeAssignmentLog({
      lead,
      branchId,
      assignmentType: 'unassigned',
      success: false,
      reason: 'Auto-assignment disabled for branch',
      ruleSnapshot: {},
      triggeredBy,
    });
    return { assigned: false, reason: 'disabled' };
  }

  const destination = await resolveDestination(lead.destination);
  let pool = [];
  let poolType = 'destination';
  let assignmentType = 'destination_match';

  if (destination) {
    pool = await getDestinationSpecialists(destination._id, branchId);
  }

  if (!pool.length) {
    poolType = 'fallback';
    assignmentType = 'fallback_queue';
    pool = await getFallbackExecutives(branchId, settings);
  }

  const eligible = await filterEligibleExecutives(pool, branchId);

  if (!eligible.length) {
    await writeAssignmentLog({
      lead,
      branchId,
      destination,
      assignmentType: destination ? 'destination_match' : 'fallback_queue',
      success: false,
      reason: destination
        ? 'No active, present specialist found for destination'
        : 'No destination match and no eligible fallback executives',
      ruleSnapshot: {
        destinationResolved: Boolean(destination),
        destinationName: destination?.name || null,
        poolSize: pool.length,
        rules: ['match_destination', 'match_branch', 'active', 'present', 'lowest_leads', 'round_robin'],
      },
      triggeredBy,
    });
    return { assigned: false, reason: 'no_eligible_executive', destination };
  }

  const pick = await pickExecutive(eligible, {
    branchId,
    destinationId: destination?._id,
    poolType,
  });

  await applyAssignmentToLead(lead, pick.executive);

  await writeAssignmentLog({
    lead,
    branchId,
    destination,
    assignedTo: pick.executive._id,
    assigneeName: pick.executive.name,
    assignmentType,
    success: true,
    reason: destination
      ? `Assigned to destination specialist (${destination.name})`
      : 'Assigned via branch fallback queue (no destination specialist)',
    ruleSnapshot: {
      destinationResolved: Boolean(destination),
      destinationName: destination?.name || null,
      poolType,
      tieBreaker: pick.tieBreaker,
      activeLeadCount: pick.activeLeadCount,
      candidates: pick.candidates,
      rules: ['match_destination', 'match_branch', 'active', 'present', 'lowest_leads', 'round_robin'],
    },
    triggeredBy,
  });

  notifyLeadAssigned({
    assigneeId: pick.executive._id,
    leadIds: [lead._id],
    leadNames: [lead.name],
    assignedBy: triggeredBy || { name: 'Auto Assignment' },
  }).catch(() => {});

  return {
    assigned: true,
    assignee: pick.executive,
    assignmentType,
    destination,
  };
}

async function getAssignmentReport({ branchId, from, to } = {}) {
  const match = {
    ...(branchId ? { branchId } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { $gte: new Date(from) } : {}),
            ...(to ? { $lte: new Date(to) } : {}),
          },
        }
      : {}),
  };

  const [byType, byDestination, recentFailures] = await Promise.all([
    LeadAssignmentLog.aggregate([
      { $match: match },
      { $group: { _id: '$assignmentType', count: { $sum: 1 }, success: { $sum: { $cond: ['$success', 1, 0] } } } },
      { $sort: { count: -1 } },
    ]),
    LeadAssignmentLog.aggregate([
      { $match: { ...match, success: true, destinationName: { $ne: null } } },
      { $group: { _id: '$destinationName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]),
    LeadAssignmentLog.find({ ...match, success: false })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('leadId', 'name leadId destination')
      .lean(),
  ]);

  const total = await LeadAssignmentLog.countDocuments(match);
  const successful = await LeadAssignmentLog.countDocuments({ ...match, success: true });

  return {
    total,
    successful,
    failed: total - successful,
    byType,
    byDestination,
    recentFailures,
  };
}

module.exports = {
  ensureDefaultDestinations,
  resolveDestination,
  autoAssignLead,
  getAssignmentReport,
  countActiveLeadsForUser,
  getBranchSettings,
  ACTIVE_LEAD_STATUSES,
};
