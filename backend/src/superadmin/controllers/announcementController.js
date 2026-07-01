const PlatformAnnouncement = require('../models/PlatformAnnouncement');
const ApiError = require('../../utils/apiError');
const asyncHandler = require('../../utils/asyncHandler');
const { logPlatformAudit } = require('../services/platformAuditService');

function formatAnnouncement(a) {
  return {
    id: a._id,
    title: a.title,
    body: a.body,
    targetType: a.targetType,
    targetCompanyIds: a.targetCompanyIds,
    targetPlanIds: a.targetPlanIds,
    channels: a.channels,
    status: a.status,
    publishedAt: a.publishedAt,
    createdAt: a.createdAt,
  };
}

const listAnnouncements = asyncHandler(async (req, res) => {
  const items = await PlatformAnnouncement.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  res.json({ data: items.map(formatAnnouncement) });
});

const createAnnouncement = asyncHandler(async (req, res) => {
  const item = await PlatformAnnouncement.create({
    ...req.body,
    createdBy: req.superAdmin._id,
    publishedAt: req.body.status === 'published' ? new Date() : null,
  });

  await logPlatformAudit({
    actor: req.superAdmin,
    action: 'announcement_create',
    resourceType: 'platform_announcement',
    resourceId: item._id,
    req,
  });

  res.status(201).json({ announcement: formatAnnouncement(item) });
});

const updateAnnouncement = asyncHandler(async (req, res) => {
  const item = await PlatformAnnouncement.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Announcement not found');

  const allowed = ['title', 'body', 'targetType', 'targetCompanyIds', 'targetPlanIds', 'channels', 'status'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) item[key] = req.body[key];
  }
  if (req.body.status === 'published' && !item.publishedAt) {
    item.publishedAt = new Date();
  }
  await item.save();

  res.json({ announcement: formatAnnouncement(item) });
});

const deleteAnnouncement = asyncHandler(async (req, res) => {
  const item = await PlatformAnnouncement.findByIdAndDelete(req.params.id);
  if (!item) throw new ApiError(404, 'Announcement not found');
  res.json({ message: 'Deleted' });
});

module.exports = { listAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement };
