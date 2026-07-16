const WebsiteActivityLog = require('../models/WebsiteActivityLog');
const asyncHandler = require('../../../utils/asyncHandler');
const { parsePagination, paginatedResponse } = require('../../../utils/pagination');

const listActivity = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 50, maxLimit: 200 });
  const filter = {};
  if (req.query.action) filter.action = req.query.action;
  if (req.query.resourceType) filter.resourceType = req.query.resourceType;
  if (req.query.q) {
    const regex = new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ title: regex }, { actorEmail: regex }, { actorName: regex }];
  }

  const [items, total] = await Promise.all([
    WebsiteActivityLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    WebsiteActivityLog.countDocuments(filter),
  ]);

  res.json(
    paginatedResponse(
      items.map((a) => ({
        id: a._id,
        actorEmail: a.actorEmail,
        actorName: a.actorName,
        action: a.action,
        resourceType: a.resourceType,
        resourceId: a.resourceId,
        title: a.title,
        metadata: a.metadata,
        ipAddress: a.ipAddress,
        createdAt: a.createdAt,
      })),
      { page, limit, total },
    ),
  );
});

module.exports = { listActivity };
