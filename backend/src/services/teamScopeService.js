const Team = require('../models/Team');
const User = require('../models/User');

async function getTeamForLeader(leaderId) {
  return Team.findOne({ teamLeader: leaderId }).populate('members', 'name email role status');
}

async function getExecutiveIdsForLeader(leaderId) {
  const team = await getTeamForLeader(leaderId);
  if (!team) return [];
  return team.members
    .filter((m) => m.role === 'sales_executive' && m.status !== 'disabled')
    .map((m) => m._id.toString());
}

/** Leads a team leader may view or assign within their squad */
async function getLeaderLeadScopeFilter(leaderId) {
  const team = await getTeamForLeader(leaderId);
  const execIds = team
    ? team.members.filter((m) => m.role === 'sales_executive').map((m) => m._id)
    : [];

  const or = [
    { assignedTo: { $in: execIds } },
    { assignedTo: leaderId },
    { assignedTeamLeader: leaderId },
  ];
  if (team?._id) or.push({ teamId: team._id });

  return { $or: or };
}

async function getTeamLeaderForExecutive(executiveId) {
  const team = await Team.findOne({ members: executiveId }).populate('teamLeader', 'name email');
  return team?.teamLeader || null;
}

async function getSquadNamesForLeader(leaderId) {
  const team = await getTeamForLeader(leaderId);
  if (!team) return [];
  const members = await User.find({ _id: { $in: team.members } }).select('name');
  return members.map((m) => m.name);
}

module.exports = {
  getTeamForLeader,
  getExecutiveIdsForLeader,
  getLeaderLeadScopeFilter,
  getTeamLeaderForExecutive,
  getSquadNamesForLeader,
};
