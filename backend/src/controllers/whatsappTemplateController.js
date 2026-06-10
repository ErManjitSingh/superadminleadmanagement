const WhatsAppTemplate = require('../models/WhatsAppTemplate');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { ensureDefaultTemplates } = require('../services/whatsappContactService');

const listTemplates = asyncHandler(async (req, res) => {
  const manage = !!req.permissions?.whatsapp?.manage;
  await ensureDefaultTemplates(req.branchId || null, req.user._id);

  const filter = { ...(req.branchId ? { branchId: req.branchId } : {}) };
  if (!manage) filter.enabled = true;

  const templates = await WhatsAppTemplate.find(filter)
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();

  res.json(templates);
});

const createTemplate = asyncHandler(async (req, res) => {
  if (!req.permissions?.whatsapp?.manage) {
    throw new ApiError(403, 'You do not have permission to manage WhatsApp templates');
  }

  const { name, body, enabled = true, sortOrder = 0 } = req.body;
  if (!name?.trim() || !body?.trim()) {
    throw new ApiError(400, 'Name and message body are required');
  }

  const template = await WhatsAppTemplate.create({
    name: name.trim(),
    body: body.trim(),
    enabled: !!enabled,
    sortOrder: Number(sortOrder) || 0,
    branchId: req.branchId || null,
    createdBy: req.user._id,
  });

  res.status(201).json(template);
});

const updateTemplate = asyncHandler(async (req, res) => {
  if (!req.permissions?.whatsapp?.manage) {
    throw new ApiError(403, 'You do not have permission to manage WhatsApp templates');
  }

  const template = await WhatsAppTemplate.findOne({
    _id: req.params.id,
    ...(req.branchId ? { branchId: req.branchId } : {}),
  });
  if (!template) throw new ApiError(404, 'Template not found');

  const { name, body, enabled, sortOrder } = req.body;
  if (name !== undefined) template.name = String(name).trim();
  if (body !== undefined) template.body = String(body).trim();
  if (enabled !== undefined) template.enabled = !!enabled;
  if (sortOrder !== undefined) template.sortOrder = Number(sortOrder) || 0;

  await template.save();
  res.json(template);
});

const deleteTemplate = asyncHandler(async (req, res) => {
  if (!req.permissions?.whatsapp?.manage) {
    throw new ApiError(403, 'You do not have permission to manage WhatsApp templates');
  }

  const template = await WhatsAppTemplate.findOneAndDelete({
    _id: req.params.id,
    ...(req.branchId ? { branchId: req.branchId } : {}),
  });
  if (!template) throw new ApiError(404, 'Template not found');
  res.json({ message: 'Template deleted' });
});

module.exports = { listTemplates, createTemplate, updateTemplate, deleteTemplate };
