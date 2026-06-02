const Team = require('../models/Team');
const User = require('../models/User');

async function getTeamForLeader(leaderId) {
  return Team.findOne({ teamLeader: leaderId }).populate('members', 'name email role');
}

async function getExecutiveIdsForLeader(leaderId) {
  const team = await getTeamForLeader(leaderId);
  if (!team) return [];
  return team.members.map((m) => m._id.toString());
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
  getTeamLeaderForExecutive,
  getSquadNamesForLeader,
};
