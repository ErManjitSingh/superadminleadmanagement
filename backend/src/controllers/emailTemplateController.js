const EmailTemplate = require('../models/EmailTemplate');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { ensureDefaultEmailTemplates } = require('../services/emailTemplateService');

const listTemplates = asyncHandler(async (req, res) => {
  const manage = !!req.permissions?.email?.manage;
  await ensureDefaultEmailTemplates(req.branchId || null, req.user._id);

  const filter = { ...(req.branchId ? { branchId: req.branchId } : {}) };
  if (!manage) filter.enabled = true;
  if (req.query.category) filter.category = req.query.category;

  const templates = await EmailTemplate.find(filter)
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();

  res.json(templates);
});

const createTemplate = asyncHandler(async (req, res) => {
  if (!req.permissions?.email?.manage) {
    throw new ApiError(403, 'You do not have permission to manage email templates');
  }

  const { name, subject, body, category = 'custom', enabled = true, sortOrder = 0 } = req.body;
  if (!name?.trim() || !subject?.trim() || !body?.trim()) {
    throw new ApiError(400, 'Name, subject, and body are required');
  }

  const template = await EmailTemplate.create({
    name: name.trim(),
    subject: subject.trim(),
    body: body.trim(),
    category,
    enabled: !!enabled,
    sortOrder: Number(sortOrder) || 0,
    branchId: req.branchId || null,
    createdBy: req.user._id,
  });

  res.status(201).json(template);
});

const updateTemplate = asyncHandler(async (req, res) => {
  if (!req.permissions?.email?.manage) {
    throw new ApiError(403, 'You do not have permission to manage email templates');
  }

  const template = await EmailTemplate.findOne({
    _id: req.params.id,
    ...(req.branchId ? { branchId: req.branchId } : {}),
  });
  if (!template) throw new ApiError(404, 'Template not found');

  const { name, subject, body, category, enabled, sortOrder } = req.body;
  if (name !== undefined) template.name = String(name).trim();
  if (subject !== undefined) template.subject = String(subject).trim();
  if (body !== undefined) template.body = String(body).trim();
  if (category !== undefined) template.category = category;
  if (enabled !== undefined) template.enabled = !!enabled;
  if (sortOrder !== undefined) template.sortOrder = Number(sortOrder) || 0;

  await template.save();
  res.json(template);
});

const deleteTemplate = asyncHandler(async (req, res) => {
  if (!req.permissions?.email?.manage) {
    throw new ApiError(403, 'You do not have permission to manage email templates');
  }

  const template = await EmailTemplate.findOneAndDelete({
    _id: req.params.id,
    ...(req.branchId ? { branchId: req.branchId } : {}),
  });
  if (!template) throw new ApiError(404, 'Template not found');
  res.json({ message: 'Template deleted' });
});

module.exports = { listTemplates, createTemplate, updateTemplate, deleteTemplate };
