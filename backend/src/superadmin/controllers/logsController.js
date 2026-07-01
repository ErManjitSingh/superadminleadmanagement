const PlatformAuditLog = require('../models/PlatformAuditLog');
const CompanyLoginLog = require('../models/CompanyLoginLog');
const asyncHandler = require('../../utils/asyncHandler');
const { parsePagination, paginatedResponse } = require('../../utils/pagination');

const listAuditLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 30 });
  const filter = {};
  if (req.query.companyId) filter.companyId = req.query.companyId;
  if (req.query.action) filter.action = req.query.action;
  if (req.query.resourceType) filter.resourceType = req.query.resourceType;
  if (req.query.search) {
    filter.$or = [
      { actorEmail: { $regex: req.query.search, $options: 'i' } },
      { action: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [data, total] = await Promise.all([
    PlatformAuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    PlatformAuditLog.countDocuments(filter),
  ]);

  res.json(paginatedResponse(data, { page, limit, total }));
});

const listLoginLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 30 });
  const filter = {};
  if (req.query.companyId) filter.companyId = req.query.companyId;
  if (req.query.loginType) filter.loginType = req.query.loginType;

  const [data, total] = await Promise.all([
    CompanyLoginLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('companyId', 'name slug')
      .lean(),
    CompanyLoginLog.countDocuments(filter),
  ]);

  res.json(paginatedResponse(data, { page, limit, total }));
});

module.exports = { listAuditLogs, listLoginLogs };
