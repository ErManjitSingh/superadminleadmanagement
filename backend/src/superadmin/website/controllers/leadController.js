const WebsiteLead = require('../models/WebsiteLead');
const SuperAdmin = require('../../models/SuperAdmin');
const asyncHandler = require('../../../utils/asyncHandler');
const ApiError = require('../../../utils/apiError');
const { parsePagination, paginatedResponse } = require('../../../utils/pagination');
const { baseDoc, applyAllowed } = require('../utils/formatters');
const { logWebsiteActivity } = require('../services/websiteActivityService');

function formatLead(doc) {
  const p = doc.toObject ? doc.toObject() : doc;
  return {
    ...baseDoc(p),
    type: p.type,
    name: p.name || '',
    email: p.email || '',
    phone: p.phone || '',
    message: p.message || '',
    trekId: p.trekId || null,
    trekTitle: p.trekTitle || '',
    destinationId: p.destinationId || null,
    preferredDate: p.preferredDate,
    travelers: p.travelers || 1,
    sourcePage: p.sourcePage || '',
    utmSource: p.utmSource || '',
    utmMedium: p.utmMedium || '',
    utmCampaign: p.utmCampaign || '',
    status: p.status,
    assignedTo: p.assignedTo || null,
    assignedToName: p.assignedToName || '',
    notes: p.notes || '',
    meta: p.meta || {},
  };
}

const listLeads = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 25, maxLimit: 100 });
  const filter = { deletedAt: null };
  if (req.query.type) filter.type = req.query.type;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
  if (req.query.q) {
    const regex = new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: regex }, { email: regex }, { phone: regex }, { message: regex }];
  }

  const [items, total] = await Promise.all([
    WebsiteLead.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    WebsiteLead.countDocuments(filter),
  ]);

  res.json(paginatedResponse(items.map(formatLead), { page, limit, total }));
});

const getLead = asyncHandler(async (req, res) => {
  const item = await WebsiteLead.findOne({ _id: req.params.id, deletedAt: null }).lean();
  if (!item) throw new ApiError(404, 'Lead not found');
  res.json({ lead: formatLead(item) });
});

const updateLead = asyncHandler(async (req, res) => {
  const item = await WebsiteLead.findOne({ _id: req.params.id, deletedAt: null });
  if (!item) throw new ApiError(404, 'Lead not found');
  applyAllowed(item, req.body, ['status', 'notes', 'message', 'name', 'email', 'phone', 'preferredDate', 'travelers']);
  await item.save();
  await logWebsiteActivity({
    actor: req.superAdmin,
    action: 'updated',
    resourceType: 'lead',
    resourceId: item._id,
    title: item.name || item.email || 'Lead',
    req,
  });
  res.json({ lead: formatLead(item) });
});

const assignLead = asyncHandler(async (req, res) => {
  const item = await WebsiteLead.findOne({ _id: req.params.id, deletedAt: null });
  if (!item) throw new ApiError(404, 'Lead not found');

  const adminId = req.body.assignedTo;
  if (!adminId) throw new ApiError(400, 'assignedTo required');
  const admin = await SuperAdmin.findById(adminId).lean();
  if (!admin) throw new ApiError(404, 'Admin not found');

  item.assignedTo = admin._id;
  item.assignedToName = admin.name;
  if (item.status === 'new') item.status = 'contacted';
  await item.save();

  res.json({ lead: formatLead(item) });
});

const deleteLead = asyncHandler(async (req, res) => {
  const item = await WebsiteLead.findOne({ _id: req.params.id, deletedAt: null });
  if (!item) throw new ApiError(404, 'Lead not found');
  item.deletedAt = new Date();
  await item.save();
  res.json({ message: 'Deleted' });
});

const exportLeads = asyncHandler(async (req, res) => {
  const filter = { deletedAt: null };
  if (req.query.type) filter.type = req.query.type;
  if (req.query.status) filter.status = req.query.status;

  const items = await WebsiteLead.find(filter).sort({ createdAt: -1 }).limit(5000).lean();
  const header = ['id', 'type', 'name', 'email', 'phone', 'message', 'trekTitle', 'status', 'assignedToName', 'createdAt'];
  const rows = items.map((l) =>
    [
      l._id,
      l.type,
      csvEscape(l.name),
      csvEscape(l.email),
      csvEscape(l.phone),
      csvEscape(l.message),
      csvEscape(l.trekTitle),
      l.status,
      csvEscape(l.assignedToName),
      l.createdAt?.toISOString?.() || '',
    ].join(','),
  );

  const csv = [header.join(','), ...rows].join('\n');

  await logWebsiteActivity({
    actor: req.superAdmin,
    action: 'exported',
    resourceType: 'lead',
    title: `Exported ${items.length} leads`,
    metadata: { count: items.length },
    req,
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="website-leads.csv"');
  res.send(csv);
});

function csvEscape(value) {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

module.exports = {
  listLeads,
  getLead,
  updateLead,
  assignLead,
  deleteLead,
  exportLeads,
  formatLead,
};
