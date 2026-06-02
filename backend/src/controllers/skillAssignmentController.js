const User = require('../models/User');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { parsePagination, paginatedResponse } = require('../utils/pagination');
const { LEAD_SKILL_TYPES, LEAD_SKILL_LABELS } = require('../config/leadSkills');
const { detectLeadType } = require('../services/leadTypeDetectionService');
const {
  autoAssignLeadBySkill,
  getSkillAssignmentReport,
  getBranchSkillSettings,
} = require('../services/skillAssignmentService');
const Lead = require('../models/Lead');
const LeadAssignmentLog = require('../models/LeadAssignmentLog');

const listSkills = asyncHandler(async (req, res) => {
  res.json(
    LEAD_SKILL_TYPES.map((id) => ({
      id,
      label: LEAD_SKILL_LABELS[id],
    }))
  );
});

const listUserSkills = asyncHandler(async (req, res) => {
  const branchId = req.branchId || req.query.branchId;
  if (!branchId) throw new ApiError(400, 'Branch context is required');

  const executives = await User.find({
    role: 'sales_executive',
    status: 'active',
    branchId,
  })
    .select('name email skills')
    .sort({ name: 1 })
    .lean();

  res.json(
    executives.map((exec) => ({
      userId: exec._id,
      name: exec.name,
      email: exec.email,
      skills: exec.skills || [],
    }))
  );
});

const updateUserSkills = asyncHandler(async (req, res) => {
  const { userId, skills = [] } = req.body;
  const branchId = req.branchId || req.body.branchId;
  if (!userId) throw new ApiError(400, 'userId is required');
  if (!branchId) throw new ApiError(400, 'Branch context is required');

  const normalized = [...new Set(skills.map((s) => String(s).toLowerCase()))].filter((s) =>
    LEAD_SKILL_TYPES.includes(s)
  );

  const user = await User.findOne({
    _id: userId,
    role: 'sales_executive',
    branchId,
    status: 'active',
  });
  if (!user) throw new ApiError(404, 'Sales executive not found in this branch');

  user.skills = normalized;
  await user.save();

  res.json({ userId, skills: user.skills });
});

const getBranchSkillSettingsHandler = asyncHandler(async (req, res) => {
  const branchId = req.branchId || req.params.branchId;
  if (!branchId) throw new ApiError(400, 'Branch context is required');

  const settings = await getBranchSkillSettings(branchId);
  const managers = settings.salesManagerQueueIds?.length
    ? await User.find({ _id: { $in: settings.salesManagerQueueIds } })
        .select('name email role status')
        .lean()
    : [];

  res.json({
    branchId,
    skillAutoAssignEnabled: settings.skillAutoAssignEnabled !== false,
    salesManagerQueueIds: settings.salesManagerQueueIds || [],
    salesManagerQueue: managers,
  });
});

const updateBranchSkillSettings = asyncHandler(async (req, res) => {
  const branchId = req.branchId || req.body.branchId;
  if (!branchId) throw new ApiError(400, 'Branch context is required');

  const settings = await getBranchSkillSettings(branchId);

  if (typeof req.body.skillAutoAssignEnabled === 'boolean') {
    settings.skillAutoAssignEnabled = req.body.skillAutoAssignEnabled;
  }

  if (Array.isArray(req.body.salesManagerQueueIds)) {
    const ids = [...new Set(req.body.salesManagerQueueIds.map(String))].filter(Boolean);
    if (ids.length) {
      const count = await User.countDocuments({
        _id: { $in: ids },
        role: 'sales_manager',
        branchId,
        status: 'active',
      });
      if (count !== ids.length) {
        throw new ApiError(400, 'Sales manager queue must contain active sales managers from this branch');
      }
    }
    settings.salesManagerQueueIds = ids;
  }

  await settings.save();
  res.json({
    branchId,
    skillAutoAssignEnabled: settings.skillAutoAssignEnabled,
    salesManagerQueueIds: settings.salesManagerQueueIds,
  });
});

const listSkillAssignmentLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 25, maxLimit: 100 });
  const filter = {
    ...(req.branchId ? { branchId: req.branchId } : {}),
    assignmentType: { $in: ['skill_match', 'sales_manager_queue'] },
    ...(req.query.leadType ? { leadType: req.query.leadType } : {}),
    ...(req.query.success === 'true' ? { success: true } : {}),
    ...(req.query.success === 'false' ? { success: false } : {}),
  };

  const [rows, total] = await Promise.all([
    LeadAssignmentLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('assignedTo', 'name email role')
      .populate('leadId', 'name leadId destination leadType status')
      .lean(),
    LeadAssignmentLog.countDocuments(filter),
  ]);

  res.json(paginatedResponse(rows, { page, limit, total }));
});

const getReports = asyncHandler(async (req, res) => {
  const report = await getSkillAssignmentReport({
    branchId: req.branchId || null,
    from: req.query.from,
    to: req.query.to,
  });
  res.json(report);
});

const detectLeadTypePreview = asyncHandler(async (req, res) => {
  const result = detectLeadType(req.body || {});
  res.json(result);
});

const triggerSkillAutoAssign = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({
    _id: req.params.leadId,
    ...(req.branchId ? { branchId: req.branchId } : {}),
  });
  if (!lead) throw new ApiError(404, 'Lead not found');
  if (lead.assignedTo) throw new ApiError(400, 'Lead is already assigned');

  const result = await autoAssignLeadBySkill(lead, { triggeredBy: req.user });
  const populated = await Lead.findById(lead._id)
    .populate('assignedTo', 'name email role')
    .populate('assignedManager', 'name email role')
    .lean();

  res.json({ ...result, lead: populated });
});

module.exports = {
  listSkills,
  listUserSkills,
  updateUserSkills,
  getBranchSkillSettings: getBranchSkillSettingsHandler,
  updateBranchSkillSettings,
  listSkillAssignmentLogs,
  getReports,
  detectLeadTypePreview,
  triggerSkillAutoAssign,
};
