const Lead = require('../models/Lead');
const WhatsAppTemplate = require('../models/WhatsAppTemplate');
const ApiError = require('../utils/apiError');
const { logLeadActivity } = require('./leadActivityService');

const DEFAULT_TEMPLATES = [
  {
    name: 'Welcome',
    body:
      'Hello {{customerName}},\n\nThank you for contacting us.\n\nHow may I assist you regarding your trip to {{destination}}?',
    sortOrder: 1,
  },
  {
    name: 'Quotation Ready',
    body:
      'Hello {{customerName}},\n\nYour quotation is ready.\n\nPlease check and let us know if you have any questions.',
    sortOrder: 2,
  },
  {
    name: 'Follow Up',
    body:
      'Hello {{customerName}},\n\nJust following up regarding your travel inquiry.\n\nPlease let us know if you would like to proceed.',
    sortOrder: 3,
  },
];

function renderTemplate(body, lead, user) {
  return String(body || '')
    .replace(/\{\{customerName\}\}/g, lead?.name || 'Customer')
    .replace(/\{\{destination\}\}/g, lead?.destination || 'your destination')
    .replace(/\{\{executiveName\}\}/g, user?.name || 'Sales Team')
    .replace(/\{\{quoteNumber\}\}/g, '');
}

async function ensureDefaultTemplates(branchId, userId) {
  const filter = branchId ? { branchId } : { branchId: null };
  const count = await WhatsAppTemplate.countDocuments(filter);
  if (count > 0) return;

  await WhatsAppTemplate.insertMany(
    DEFAULT_TEMPLATES.map((t) => ({
      ...t,
      enabled: true,
      branchId: branchId || null,
      createdBy: userId || null,
    }))
  );
}

async function listTemplates({ branchId, includeDisabled = false } = {}) {
  const filter = { ...(branchId ? { branchId } : {}) };
  if (!includeDisabled) filter.enabled = true;
  return WhatsAppTemplate.find(filter).sort({ sortOrder: 1, createdAt: 1 }).lean();
}

async function assertCanAccessLead(req, leadId) {
  const lead = await Lead.findOne({
    _id: leadId,
    isDeleted: { $ne: true },
    ...(req.branchId ? { branchId: req.branchId } : {}),
  });
  if (!lead) throw new ApiError(404, 'Lead not found');

  if (req.user.role === 'sales_executive') {
    if (String(lead.assignedTo) !== String(req.user._id)) {
      throw new ApiError(403, 'Lead not assigned to you');
    }
  }

  return lead;
}

async function recordWhatsAppContact({ req, leadId, templateId = null }) {
  const lead = await assertCanAccessLead(req, leadId);
  const now = new Date();
  let templateName = '';

  if (templateId) {
    const template = await WhatsAppTemplate.findOne({
      _id: templateId,
      enabled: true,
      ...(req.branchId ? { branchId: req.branchId } : {}),
    }).lean();
    if (!template) throw new ApiError(404, 'Template not found');
    templateName = template.name;
  }

  lead.lastContactedAt = now;
  lead.lastContactMethod = 'whatsapp';
  lead.lastContactedBy = req.user._id;
  if (!lead.firstContactAt) lead.firstContactAt = now;
  await lead.save();

  await logLeadActivity({
    leadId: lead._id,
    branchId: lead.branchId,
    type: 'whatsapp_contact_initiated',
    title: 'WhatsApp Contact Initiated',
    description: templateName
      ? `WhatsApp opened · Template: ${templateName}`
      : 'WhatsApp opened to contact customer',
    actor: req.user,
    meta: {
      method: 'whatsapp',
      templateId: templateId || null,
      templateName: templateName || null,
    },
  });

  return {
    leadId: lead._id,
    lastContactedAt: lead.lastContactedAt,
    lastContactMethod: lead.lastContactMethod,
    lastContactedBy: req.user._id,
    contactedByName: req.user.name,
  };
}

module.exports = {
  DEFAULT_TEMPLATES,
  renderTemplate,
  ensureDefaultTemplates,
  listTemplates,
  recordWhatsAppContact,
  assertCanAccessLead,
};
