const Quotation = require('../models/Quotation');
const Lead = require('../models/Lead');
const EmailLog = require('../models/EmailLog');
const ApiError = require('../utils/apiError');
const branding = require('../config/branding');
const quotationPdfService = require('./quotationPdfService');
const whatsappService = require('./whatsappService');
const { isEmailConfigured, sendMailMessage } = require('./emailService');
const { logLeadActivity } = require('./leadActivityService');
const storageService = require('./storageService');

function buildWhatsAppCaption({ quotation, lead, executiveName }) {
  const packageName =
    quotation.packageInfo?.packageName ||
    quotation.packageSnapshot?.name ||
    quotation.package?.name ||
    'travel package';
  const destination =
    quotation.packageInfo?.destination ||
    lead.destination ||
    'your trip';
  const total = Number(quotation.pricing?.total || quotation.costing?.grandTotal || 0);
  const price = total > 0 ? `Rs.${total.toLocaleString('en-IN')}` : '';

  const lines = [
    `Hello ${lead.name || 'Sir/Madam'},`,
    '',
    `Greetings from ${executiveName || branding.brandName}!`,
    '',
    `Your quotation is ready for ${destination}:`,
    `Package: ${packageName}`,
  ];
  if (price) lines.push(`Total: ${price}`);
  if (quotation.quoteNumber) lines.push(`Quote #: ${quotation.quoteNumber}`);
  lines.push('', 'Please find the quotation PDF attached.', 'Thank you!');
  return lines.join('\n');
}

async function sendQuotationWhatsApp({ quotationId, companyId, user, phone: phoneOverride }) {
  const { file, quotation } = await quotationPdfService.ensurePdfReady({
    quotationId,
    companyId,
    userId: user?._id,
  });

  const leadId = quotation.lead?._id || quotation.lead;
  const lead = await Lead.findById(leadId).lean();
  if (!lead) throw new ApiError(404, 'Lead not found for this quotation');

  const phone = phoneOverride || lead.whatsapp || lead.phone;
  if (!phone) {
    throw new ApiError(400, 'Customer phone number is missing on this lead');
  }

  const caption = buildWhatsAppCaption({
    quotation,
    lead,
    executiveName: user?.name,
  });

  const absolutePath = storageService.resolveAbsolutePath(file.storagePath);
  const result = await whatsappService.sendDocument({
    companyId,
    phone,
    filePath: absolutePath,
    fileName: file.originalFileName || file.fileName,
    mimeType: file.mimeType || 'application/pdf',
    caption,
  });

  quotation.sentAt = new Date();
  if (quotation.status === 'draft' || quotation.status === 'approved') {
    quotation.status = 'sent';
  }
  quotation.timeline = [
    ...(quotation.timeline || []),
    {
      type: 'sent_whatsapp',
      date: new Date(),
      user: user?.name || 'System',
      notes: `Quotation PDF v${file.version} sent on WhatsApp`,
    },
  ];
  await quotation.save();

  await logLeadActivity({
    leadId: lead._id,
    branchId: lead.branchId,
    type: 'whatsapp_sent',
    title: 'Quotation PDF Sent on WhatsApp',
    description: `${quotation.quoteNumber} · PDF v${file.version}`,
    actor: user,
    meta: {
      quotationId: quotation._id,
      pdfFileId: file._id,
      messageId: result.messageId,
      provider: result.provider,
    },
  }).catch(() => {});

  await logLeadActivity({
    leadId: lead._id,
    branchId: lead.branchId,
    type: 'quotation_sent',
    title: 'Quotation Sent',
    description: `WhatsApp · ${quotation.quoteNumber}`,
    actor: user,
    meta: { quotationId: quotation._id, channel: 'whatsapp' },
  }).catch(() => {});

  const leadDoc = await Lead.findById(lead._id);
  if (leadDoc) {
    leadDoc.lastContactedAt = new Date();
    leadDoc.lastContactMethod = 'whatsapp';
    leadDoc.lastContactedBy = user?._id;
    if (!leadDoc.firstContactAt) leadDoc.firstContactAt = new Date();
    await leadDoc.save();
  }

  return {
    success: true,
    messageId: result.messageId,
    provider: result.provider,
    pdfVersion: file.version,
    fileName: file.originalFileName || file.fileName,
  };
}

async function sendQuotationEmail({
  quotationId,
  companyId,
  user,
  to: toOverride,
  subject: subjectOverride,
  message: messageOverride,
}) {
  if (!isEmailConfigured()) {
    throw new ApiError(503, 'Email service is not configured. Contact your administrator.');
  }

  const { buffer, file, quotation } = await quotationPdfService.getPdfBuffer({
    quotationId,
    companyId,
  });

  const leadId = quotation.lead?._id || quotation.lead;
  const lead = await Lead.findById(leadId).lean();
  if (!lead) throw new ApiError(404, 'Lead not found for this quotation');

  const to = toOverride || lead.email;
  if (!to) throw new ApiError(400, 'Customer email is missing on this lead');

  const packageName =
    quotation.packageInfo?.packageName ||
    quotation.packageSnapshot?.name ||
    quotation.package?.name ||
    'Travel Package';
  const subject =
    subjectOverride ||
    `Your Quotation ${quotation.quoteNumber || ''} — ${packageName}`.trim();
  const bodyText =
    messageOverride ||
    [
      `Dear ${lead.name || 'Guest'},`,
      '',
      `Please find attached your quotation (${quotation.quoteNumber || 'quote'}) for ${packageName}.`,
      '',
      'If you have any questions or would like changes, reply to this email.',
      '',
      `Regards,`,
      user?.name || branding.brandName,
    ].join('\n');

  const fileName = file.originalFileName || file.fileName || 'quotation.pdf';

  const emailLog = await EmailLog.create({
    leadId: lead._id,
    quotationId: quotation._id,
    branchId: lead.branchId,
    companyId,
    to: [to],
    subject,
    category: 'quotation',
    status: 'queued',
    sentBy: user?._id,
    sentByName: user?.name || '',
    bodyText,
    attachmentNames: [fileName],
  }).catch(() => null);

  try {
    const info = await sendMailMessage({
      to,
      subject,
      text: bodyText,
      html: `<pre style="font-family:inherit;white-space:pre-wrap">${bodyText}</pre>`,
      attachments: [
        {
          filename: fileName,
          content: buffer.toString('base64'),
          encoding: 'base64',
          contentType: 'application/pdf',
        },
      ],
    });

    if (emailLog) {
      emailLog.status = 'sent';
      emailLog.sentAt = new Date();
      emailLog.messageId = info.messageId || '';
      await emailLog.save();
    }

    quotation.timeline = [
      ...(quotation.timeline || []),
      {
        type: 'sent_email',
        date: new Date(),
        user: user?.name || 'System',
        notes: `Quotation PDF v${file.version} emailed to ${to}`,
      },
    ];
    await quotation.save();

    await logLeadActivity({
      leadId: lead._id,
      branchId: lead.branchId,
      type: 'email_sent',
      title: 'Quotation PDF Sent by Email',
      description: `${quotation.quoteNumber} · ${to}`,
      actor: user,
      meta: {
        quotationId: quotation._id,
        pdfFileId: file._id,
        messageId: info.messageId,
      },
    }).catch(() => {});

    await logLeadActivity({
      leadId: lead._id,
      branchId: lead.branchId,
      type: 'quotation_sent',
      title: 'Quotation Sent',
      description: `Email · ${quotation.quoteNumber}`,
      actor: user,
      meta: { quotationId: quotation._id, channel: 'email' },
    }).catch(() => {});

    return {
      success: true,
      messageId: info.messageId || null,
      pdfVersion: file.version,
      fileName,
      to,
    };
  } catch (err) {
    if (emailLog) {
      emailLog.status = 'failed';
      emailLog.errorMessage = err.message || 'Failed to send email';
      emailLog.sentAt = new Date();
      await emailLog.save();
    }
    throw new ApiError(502, `Email send failed: ${err.message || 'unknown error'}`);
  }
}

module.exports = {
  sendQuotationWhatsApp,
  sendQuotationEmail,
  buildWhatsAppCaption,
};
