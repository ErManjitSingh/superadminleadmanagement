const Lead = require('../models/Lead');
const EmailTemplate = require('../models/EmailTemplate');
const EmailLog = require('../models/EmailLog');
const ApiError = require('../utils/apiError');
const { isEmailConfigured, normalizeRecipients } = require('./emailService');
const { enqueueEmailJob } = require('./emailQueueService');
const { renderEmailTemplate } = require('./emailTemplateService');

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

function textToHtml(text) {
  return String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .join('<br/>');
}

async function queueLeadEmail({ req, leadId, payload }) {
  if (!isEmailConfigured()) {
    throw new ApiError(503, 'Email service is not configured. Contact your administrator.');
  }

  const lead = await assertCanAccessLead(req, leadId);
  const {
    to,
    cc,
    bcc,
    subject,
    message,
    html,
    category = 'custom',
    templateId,
    quotationId,
    attachments = [],
  } = payload;

  let resolvedSubject = subject?.trim() || '';
  let resolvedBody = message?.trim() || html?.trim() || '';

  if (templateId) {
    const template = await EmailTemplate.findOne({
      _id: templateId,
      enabled: true,
      ...(req.branchId ? { branchId: req.branchId } : {}),
    }).lean();
    if (!template) throw new ApiError(404, 'Email template not found');

    const context = {
      customerName: lead.name,
      destination: lead.destination,
      travelDate: lead.travelDate,
      executiveName: req.user.name,
      quotationNumber: payload.quotationNumber,
      amount: payload.amount ?? lead.budget,
    };
    if (!resolvedSubject) resolvedSubject = renderEmailTemplate(template.subject, context);
    if (!resolvedBody) resolvedBody = renderEmailTemplate(template.body, context);
  }

  if (!resolvedSubject) throw new ApiError(400, 'Subject is required');
  if (!resolvedBody) throw new ApiError(400, 'Message is required');

  const recipients = normalizeRecipients(to || lead.email);
  if (!recipients.length) throw new ApiError(400, 'Recipient email is required');

  const attachmentNames = (attachments || []).map((a) => a.filename).filter(Boolean);

  const log = await EmailLog.create({
    leadId: lead._id,
    quotationId: quotationId || null,
    branchId: lead.branchId || req.branchId || null,
    category,
    to: recipients,
    cc: normalizeRecipients(cc),
    bcc: normalizeRecipients(bcc),
    subject: resolvedSubject,
    status: 'queued',
    sentBy: req.user._id,
    sentByName: req.user.name,
    attachmentNames,
    templateId: templateId || null,
  });

  enqueueEmailJob({
    logId: log._id,
    leadId: lead._id,
    branchId: lead.branchId,
    category,
    to: recipients,
    cc: normalizeRecipients(cc),
    bcc: normalizeRecipients(bcc),
    subject: resolvedSubject,
    html: html || textToHtml(resolvedBody),
    text: resolvedBody,
    attachments,
    actor: req.user,
  });

  return {
    emailLogId: log._id,
    status: 'queued',
    subject: resolvedSubject,
    to: recipients,
  };
}

async function getLeadEmailHistory(leadId, { branchId, limit = 30 } = {}) {
  const rows = await EmailLog.find({
    leadId,
    ...(branchId ? { branchId } : {}),
  })
    .sort({ createdAt: -1 })
    .limit(Math.min(limit, 50))
    .select('to cc bcc subject status sentByName sentAt createdAt category errorMessage attachmentNames')
    .lean();

  return rows.map((row) => ({
    _id: row._id,
    to: row.to,
    cc: row.cc,
    bcc: row.bcc,
    subject: row.subject,
    status: row.status,
    sentBy: row.sentByName,
    sentAt: row.sentAt || row.createdAt,
    category: row.category,
    errorMessage: row.errorMessage,
    attachments: row.attachmentNames,
  }));
}

module.exports = { queueLeadEmail, getLeadEmailHistory, assertCanAccessLead };
