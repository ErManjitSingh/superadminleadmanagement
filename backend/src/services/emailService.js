require('../config/env');
const nodemailer = require('nodemailer');
const branding = require('../config/branding');
const { decrypt } = require('../utils/secretCrypto');

const DEFAULT_FROM = branding.salesEmail;
const DEFAULT_FROM_NAME = branding.brandName;

let platformTransporter = null;
const tenantTransporterCache = new Map();

function platformSmtpConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function isEmailConfigured(companyId = null) {
  if (!companyId) return platformSmtpConfigured();
  return platformSmtpConfigured();
}

async function loadTenantSmtp(companyId) {
  if (!companyId) return null;
  const Company = require('../superadmin/models/Company');
  const company = await Company.findById(companyId).select('tenantSettings name').lean();
  const settings = company?.tenantSettings;
  if (!settings?.smtpHost || !settings?.smtpUser || !settings?.smtpPass) return null;

  const port = Number(settings.smtpPort || 587);
  const encryption = String(settings.smtpEncryption || '').toLowerCase();
  const secure = encryption === 'ssl' || port === 465;

  return {
    host: settings.smtpHost,
    port,
    secure,
    auth: {
      user: settings.smtpUser,
      pass: decrypt(settings.smtpPass),
    },
    requireTLS: encryption === 'tls' || encryption === 'starttls',
    fromName: settings.smtpFromName || company.name || DEFAULT_FROM_NAME,
    fromEmail: settings.smtpFromEmail || settings.smtpUser,
    replyTo: settings.smtpReplyTo || settings.smtpFromEmail || settings.smtpUser,
  };
}

async function isEmailConfiguredFor(companyId) {
  const tenant = await loadTenantSmtp(companyId);
  if (tenant) return true;
  return platformSmtpConfigured();
}

function getPlatformTransporter() {
  if (!platformSmtpConfigured()) {
    throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.');
  }
  if (!platformTransporter) {
    platformTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return platformTransporter;
}

function getTenantTransporter(config, companyId) {
  const key = String(companyId);
  if (!tenantTransporterCache.has(key)) {
    tenantTransporterCache.set(key, nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
      requireTLS: config.requireTLS,
    }));
  }
  return tenantTransporterCache.get(key);
}

function clearTenantTransporterCache(companyId) {
  if (companyId) tenantTransporterCache.delete(String(companyId));
  else tenantTransporterCache.clear();
}

function getTransporter() {
  return getPlatformTransporter();
}

function normalizeRecipients(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  return String(value)
    .split(/[,;]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

function normalizeAttachments(attachments = []) {
  if (!Array.isArray(attachments)) return [];
  return attachments
    .filter((a) => a?.filename && a?.content)
    .map((a) => ({
      filename: String(a.filename).trim(),
      content: Buffer.from(a.content, a.encoding || 'base64'),
      contentType: a.contentType || undefined,
    }));
}

async function sendMailMessage({
  companyId = null,
  to,
  cc = [],
  bcc = [],
  subject,
  html,
  text,
  attachments = [],
  replyTo,
  headers = {},
  fromName,
  fromEmail,
}) {
  const tenant = companyId ? await loadTenantSmtp(companyId) : null;
  const transport = tenant
    ? getTenantTransporter(tenant, companyId)
    : getPlatformTransporter();

  const resolvedFromName = fromName || tenant?.fromName || DEFAULT_FROM_NAME;
  const resolvedFromEmail = fromEmail || tenant?.fromEmail || DEFAULT_FROM;

  const mailOptions = {
    from: `"${resolvedFromName}" <${resolvedFromEmail}>`,
    to: normalizeRecipients(to),
    cc: normalizeRecipients(cc),
    bcc: normalizeRecipients(bcc),
    subject: String(subject || '').trim(),
    html: html || undefined,
    text: text || undefined,
    attachments: normalizeAttachments(attachments),
    replyTo: replyTo || tenant?.replyTo || resolvedFromEmail || DEFAULT_FROM,
    headers: { ...headers },
  };

  if (!mailOptions.to.length) {
    throw new Error('At least one recipient is required');
  }
  if (!mailOptions.subject) {
    throw new Error('Subject is required');
  }

  return transport.sendMail(mailOptions);
}

module.exports = {
  DEFAULT_FROM,
  DEFAULT_FROM_NAME,
  isEmailConfigured,
  isEmailConfiguredFor,
  getTransporter,
  getPlatformTransporter,
  loadTenantSmtp,
  clearTenantTransporterCache,
  normalizeRecipients,
  normalizeAttachments,
  sendMailMessage,
};
