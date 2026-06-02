const Destination = require('../models/Destination');
const UserDestination = require('../models/UserDestination');
const User = require('../models/User');
const BranchAssignmentSettings = require('../models/BranchAssignmentSettings');
const LeadAssignmentLog = require('../models/LeadAssignmentLog');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { parsePagination, paginatedResponse } = require('../utils/pagination');
const { normalizeDestinationKey } = require('../models/Destination');
const {
  ensureDefaultDestinations,
  autoAssignLead,
  getAssignmentReport,
  getBranchSettings,
} = require('../services/destinationAssignmentService');
const Lead = require('../models/Lead');

const listDestinations = asyncHandler(async (req, res) => {
  await ensureDefaultDestinations();
  const status = req.query.status;
  const filter = status ? { status } : {};
  const destinations = await Destination.find(filter).sort({ name: 1 }).lean();
  res.json(destinations);
});

const createDestination = asyncHandler(async (req, res) => {
  const { name, aliases = [], description, status } = req.body;
  if (!name?.trim()) throw new ApiError(400, 'Destination name is required');

  const normalizedKey = normalizeDestinationKey(name);
  const exists = await Destination.findOne({ normalizedKey });
  if (exists) throw new ApiError(400, 'Destination already exists');

  const destination = await Destination.create({
    name: name.trim(),
    normalizedKey,
    aliases: Array.isArray(aliases) ? aliases.map((a) => String(a).trim()).filter(Boolean) : [],
    description: description?.trim() || '',
    status: status || 'active',
  });
  res.status(201).json(destination);
});

const updateDestination = asyncHandler(async (req, res) => {
  const destination = await Destination.findById(req.params.id);
  if (!destination) throw new ApiError(404, 'Destination not found');

  if (req.body.name?.trim()) {
    destination.name = req.body.name.trim();
    destination.normalizedKey = normalizeDestinationKey(destination.name);
  }
  if (Array.isArray(req.body.aliases)) {
    destination.aliases = req.body.aliases.map((a) => String(a).trim()).filter(Boolean);
  }
  if (req.body.description !== undefined) destination.description = String(req.body.description || '').trim();
  if (req.body.status) destination.status = req.body.status;

  await destination.save();
  res.json(destination);
});

const deleteDestination = asyncHandler(async (req, res) => {
  const destination = await Destination.findById(req.params.id);
  if (!destination) throw new ApiError(404, 'Destination not found');

  const mappingCount = await UserDestination.countDocuments({ destinationId: destination._id });
  if (mappingCount > 0) {
    throw new ApiError(400, 'Remove user mappings before deleting this destination');
  }

  destination.status = 'inactive';
  await destination.save();
  res.json({ message: 'Destination deactivated' });
});

const listUserMappings = asyncHandler(async (req, res) => {
  const branchId = req.branchId || req.query.branchId;
  if (!branchId) throw new ApiError(400, 'Branch context is required');

  const executives = await User.find({
    role: 'sales_executive',
    status: 'active',
    branchId,
  })
    .select('name email branchId')
    .sort({ name: 1 })
    .lean();

  const mappings = await UserDestination.find({ branchId })
    .populate('destinationId', 'name status')
    .lean();

  const byUser = new Map();
  for (const row of mappings) {
    const uid = String(row.userId);
    if (!byUser.has(uid)) byUser.set(uid, []);
    if (row.destinationId?.status === 'active') {
      byUser.get(uid).push({
        _id: row.destinationId._id,
        name: row.destinationId.name,
        mappingId: row._id,
      });
    }
  }

  res.json(
    executives.map((exec) => ({
      userId: exec._id,
      name: exec.name,
      email: exec.email,
      destinations: byUser.get(String(exec._id)) || [],
    }))
  );
});

const updateUserMappings = asyncHandler(async (req, res) => {
  const { userId, destinationIds = [] } = req.body;
  const branchId = req.branchId || req.body.branchId;
  if (!userId) throw new ApiError(400, 'userId is required');
  if (!branchId) throw new ApiError(400, 'Branch context is required');

  const user = await User.findOne({
    _id: userId,
    role: 'sales_executive',
    branchId,
    status: 'active',
  });
  if (!user) throw new ApiError(404, 'Sales executive not found in this branch');

  const ids = [...new Set(destinationIds.map(String))].filter(Boolean);
  if (ids.length) {
    const count = await Destination.countDocuments({ _id: { $in: ids }, status: 'active' });
    if (count !== ids.length) throw new ApiError(400, 'One or more destinations are invalid');
  }

  await UserDestination.deleteMany({ userId, branchId });
  if (ids.length) {
    await UserDestination.insertMany(
      ids.map((destinationId) => ({ userId, destinationId, branchId }))
    );
  }

  res.json({ userId, branchId, destinationIds: ids });
});

const getBranchAssignmentSettings = asyncHandler(async (req, res) => {
  const branchId = req.branchId || req.params.branchId;
  if (!branchId) throw new ApiError(400, 'Branch context is required');

  const settings = await getBranchSettings(branchId);
  const users = settings.fallbackUserIds?.length
    ? await User.find({ _id: { $in: settings.fallbackUserIds } })
        .select('name email role status')
        .lean()
    : [];

  res.json({
    branchId,
    autoAssignEnabled: settings.autoAssignEnabled,
    fallbackUserIds: settings.fallbackUserIds,
    fallbackUsers: users,
  });
});

const updateBranchAssignmentSettings = asyncHandler(async (req, res) => {
  const branchId = req.branchId || req.body.branchId;
  if (!branchId) throw new ApiError(400, 'Branch context is required');

  const settings = await getBranchSettings(branchId);

  if (typeof req.body.autoAssignEnabled === 'boolean') {
    settings.autoAssignEnabled = req.body.autoAssignEnabled;
  }

  if (Array.isArray(req.body.fallbackUserIds)) {
    const ids = [...new Set(req.body.fallbackUserIds.map(String))].filter(Boolean);
    if (ids.length) {
      const count = await User.countDocuments({
        _id: { $in: ids },
        role: 'sales_executive',
        branchId,
        status: 'active',
      });
      if (count !== ids.length) {
        throw new ApiError(400, 'Fallback queue must contain active sales executives from this branch');
      }
    }
    settings.fallbackUserIds = ids;
  }

  await settings.save();
  res.json({
    branchId,
    autoAssignEnabled: settings.autoAssignEnabled,
    fallbackUserIds: settings.fallbackUserIds,
  });
});

const listAssignmentLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 25, maxLimit: 100 });
  const filter = {
    ...(req.branchId ? { branchId: req.branchId } : {}),
    ...(req.query.assignmentType ? { assignmentType: req.query.assignmentType } : {}),
    ...(req.query.success === 'true' ? { success: true } : {}),
    ...(req.query.success === 'false' ? { success: false } : {}),
  };

  const [rows, total] = await Promise.all([
    LeadAssignmentLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('assignedTo', 'name email')
      .populate('leadId', 'name leadId destination status')
      .lean(),
    LeadAssignmentLog.countDocuments(filter),
  ]);

  res.json(paginatedResponse(rows, { page, limit, total }));
});

const getReports = asyncHandler(async (req, res) => {
  const report = await getAssignmentReport({
    branchId: req.branchId || null,
    from: req.query.from,
    to: req.query.to,
  });
  res.json(report);
});

const triggerAutoAssign = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({
    _id: req.params.leadId,
    ...(req.branchId ? { branchId: req.branchId } : {}),
  });
  if (!lead) throw new ApiError(404, 'Lead not found');
  if (lead.assignedTo) throw new ApiError(400, 'Lead is already assigned');

  const result = await autoAssignLead(lead, { triggeredBy: req.user });
  const populated = await Lead.findById(lead._id)
    .populate('assignedTo', 'name email role')
    .lean();

  res.json({ ...result, lead: populated });
});

module.exports = {
  listDestinations,
  createDestination,
  updateDestination,
  deleteDestination,
  listUserMappings,
  updateUserMappings,
  getBranchAssignmentSettings,
  updateBranchAssignmentSettings,
  listAssignmentLogs,
  getReports,
  triggerAutoAssign,
};
