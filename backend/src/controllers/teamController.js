const Team = require('../models/Team');
const User = require('../models/User');
const Lead = require('../models/Lead');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { sumConvertedPackageRevenue } = require('../utils/convertedPackageRevenue');
const { tenantFilter, companyScopedIdFilter, assertTenantDocument } = require('../utils/tenantDocument');

async function computeTeamStats(team, companyId) {
  const memberIds = team.members.map((m) => m._id || m);
  const teamLeads = await Lead.find(tenantFilter({ assignedTo: { $in: memberIds } }, { companyId })).lean();
  const converted = teamLeads.filter((l) => l.status === 'converted');
  const revenue = await sumConvertedPackageRevenue({ assigneeIds: memberIds });

  return {
    membersCount: team.members.length,
    leadsAssigned: teamLeads.length,
    conversions: converted.length,
    revenue,
  };
}

async function enrichTeam(team, companyId) {
  const obj = team.toObject ? team.toObject() : team;
  return { ...obj, stats: await computeTeamStats(obj, companyId) };
}

const listTeams = asyncHandler(async (req, res) => {
  const teams = await Team.find(tenantFilter({}, req))
    .populate('teamLeader', 'name email')
    .populate('members', 'name email')
    .populate('salesManager', 'name email')
    .sort({ createdAt: -1 });

  const enriched = await Promise.all(teams.map((t) => enrichTeam(t, req.companyId)));
  res.json(enriched);
});

const getTeam = asyncHandler(async (req, res) => {
  const team = await Team.findOne(companyScopedIdFilter(req.params.id, req))
    .populate('teamLeader', 'name email')
    .populate('members', 'name email')
    .populate('salesManager', 'name email');

  assertTenantDocument(team, req, 'Team');
  res.json(await enrichTeam(team, req.companyId));
});

const createTeam = asyncHandler(async (req, res) => {
  const leader = await User.findOne(companyScopedIdFilter(req.body.teamLeaderId, req));
  assertTenantDocument(leader, req, 'Team leader');

  const team = await Team.create({
    name: req.body.name,
    description: req.body.description || '',
    teamLeader: leader._id,
    salesManager: req.user._id,
    members: [],
    companyId: req.companyId,
    branchId: req.branchId || leader.branchId || null,
  });

  const populated = await Team.findById(team._id)
    .populate('teamLeader', 'name email')
    .populate('members', 'name email');

  res.status(201).json(await enrichTeam(populated, req.companyId));
});

const updateTeam = asyncHandler(async (req, res) => {
  const team = await Team.findOne(companyScopedIdFilter(req.params.id, req));
  assertTenantDocument(team, req, 'Team');

  if (req.body.teamLeaderId) {
    const leader = await User.findOne(companyScopedIdFilter(req.body.teamLeaderId, req));
    assertTenantDocument(leader, req, 'Team leader');
    team.teamLeader = leader._id;
  }
  if (req.body.name !== undefined) team.name = req.body.name;
  if (req.body.description !== undefined) team.description = req.body.description;

  await team.save();

  const populated = await Team.findById(team._id)
    .populate('teamLeader', 'name email')
    .populate('members', 'name email');

  res.json(await enrichTeam(populated, req.companyId));
});

const deleteTeam = asyncHandler(async (req, res) => {
  const team = await Team.findOne(companyScopedIdFilter(req.params.id, req));
  assertTenantDocument(team, req, 'Team');
  await team.deleteOne();
  res.json({ message: 'Team deleted' });
});

const listTeamLeaders = asyncHandler(async (req, res) => {
  const leaders = await User.find(tenantFilter({ role: 'team_leader', status: 'active' }, req))
    .select('name email')
    .lean();
  res.json(leaders);
});

const listAvailableExecutives = asyncHandler(async (req, res) => {
  const teams = await Team.find(tenantFilter({}, req)).select('members');
  const assigned = new Set(teams.flatMap((t) => t.members.map((m) => m.toString())));

  const executives = await User.find(tenantFilter({
    role: 'sales_executive',
    status: 'active',
    _id: { $nin: [...assigned] },
  }, req))
    .select('name email')
    .lean();

  res.json(executives);
});

const addMember = asyncHandler(async (req, res) => {
  const team = await Team.findOne(companyScopedIdFilter(req.params.id, req));
  assertTenantDocument(team, req, 'Team');

  const exec = await User.findOne(companyScopedIdFilter(req.body.executiveId, req));
  assertTenantDocument(exec, req, 'Executive');

  const existing = await Team.findOne(tenantFilter({ members: exec._id, _id: { $ne: team._id } }, req));
  if (existing) throw new ApiError(400, 'Executive already belongs to a team');

  if (!team.members.some((m) => m.toString() === exec._id.toString())) {
    team.members.push(exec._id);
    await team.save();
  }

  if (!exec.teamId || String(exec.teamId) !== String(team._id)) {
    exec.teamId = team._id;
    if (!exec.companyId && team.companyId) exec.companyId = team.companyId;
    if (!exec.branchId && team.branchId) exec.branchId = team.branchId;
    await exec.save();
  }

  const populated = await Team.findById(team._id)
    .populate('teamLeader', 'name email')
    .populate('members', 'name email');

  res.json(await enrichTeam(populated, req.companyId));
});

const removeMember = asyncHandler(async (req, res) => {
  const team = await Team.findOne(companyScopedIdFilter(req.params.id, req));
  assertTenantDocument(team, req, 'Team');

  team.members = team.members.filter((m) => m.toString() !== req.params.memberId);
  await team.save();

  const populated = await Team.findById(team._id)
    .populate('teamLeader', 'name email')
    .populate('members', 'name email');

  res.json(await enrichTeam(populated, req.companyId));
});

const transferMember = asyncHandler(async (req, res) => {
  const fromTeam = await Team.findOne(companyScopedIdFilter(req.params.id, req));
  const toTeam = await Team.findOne(companyScopedIdFilter(req.body.targetTeamId, req));
  assertTenantDocument(fromTeam, req, 'Team');
  assertTenantDocument(toTeam, req, 'Team');

  const memberIdx = fromTeam.members.findIndex((m) => m.toString() === req.body.executiveId);
  if (memberIdx === -1) throw new ApiError(404, 'Member not found');

  const [memberId] = fromTeam.members.splice(memberIdx, 1);
  toTeam.members.push(memberId);
  await fromTeam.save();
  await toTeam.save();

  res.json({ message: 'Executive transferred', from: fromTeam.name, to: toTeam.name });
});

const updateTeamLeader = asyncHandler(async (req, res) => {
  const team = await Team.findOne(companyScopedIdFilter(req.params.id, req));
  assertTenantDocument(team, req, 'Team');

  const leader = await User.findOne(companyScopedIdFilter(req.body.teamLeaderId, req));
  assertTenantDocument(leader, req, 'Team leader');

  team.teamLeader = leader._id;
  await team.save();

  const populated = await Team.findById(team._id)
    .populate('teamLeader', 'name email')
    .populate('members', 'name email');

  res.json(await enrichTeam(populated, req.companyId));
});

const getTeamPerformance = asyncHandler(async (req, res) => {
  const { buildTeamPerformance } = require('../services/dashboardService');
  const data = await buildTeamPerformance({ branchId: req.branchId });
  res.json(data);
});

module.exports = {
  listTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  listTeamLeaders,
  listAvailableExecutives,
  addMember,
  removeMember,
  transferMember,
  updateTeamLeader,
  getTeamPerformance,
};
