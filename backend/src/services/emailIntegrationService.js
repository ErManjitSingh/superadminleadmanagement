const nodemailer = require('nodemailer');
const Company = require('../superadmin/models/Company');
const EmailLog = require('../models/EmailLog');
const { encrypt, decrypt } = require('../utils/secretCrypto');
const { clearTenantTransporterCache } = require('./emailService');
const {
  EMAIL_PROVIDERS,
  DEFAULT_EMAIL_MODULES,
  DEFAULT_EMAIL_SIGNATURE,
  TEMPLATE_VARIABLES,
  DAILY_EMAIL_LIMIT,
} = require('../constants/emailProviders');

const MASK = '••••••••';

function resolveSecure(port, encryption) {
  const enc = String(encryption || '').toLowerCase();
  if (enc === 'ssl') return true;
  if (enc === 'tls' || enc === 'starttls') return false;
  return Number(port) === 465;
}

function buildTransportConfig(settings) {
  const port = Number(settings.smtpPort || 587);
  const encryption = settings.smtpEncryption || 'tls';
  const pass = settings.smtpPass ? decrypt(settings.smtpPass) : '';
  return {
    host: settings.smtpHost,
    port,
    secure: resolveSecure(port, encryption),
    auth: {
      user: settings.smtpUser,
      pass,
    },
    requireTLS: encryption === 'starttls' || encryption === 'tls',
  };
}

function normalizeSettingsInput(body = {}) {
  return {
    smtpProvider: body.smtpProvider || body.provider || 'smtp',
    smtpFromEmail: String(body.smtpFromEmail || body.officialEmail || body.smtpUser || '').trim().toLowerCase(),
    smtpHost: String(body.smtpHost || '').trim(),
    smtpPort: Number(body.smtpPort || 587),
    smtpEncryption: body.smtpEncryption || body.encryption || 'tls',
    smtpUser: String(body.smtpUser || body.smtpFromEmail || '').trim(),
    smtpFromName: String(body.smtpFromName || body.senderName || '').trim(),
    smtpReplyTo: String(body.smtpReplyTo || body.replyToEmail || '').trim().toLowerCase(),
    smtpBounceEmail: String(body.smtpBounceEmail || body.bounceEmail || '').trim().toLowerCase(),
    emailModules: { ...DEFAULT_EMAIL_MODULES, ...(body.emailModules || {}) },
    emailSignature: { ...DEFAULT_EMAIL_SIGNATURE, ...(body.emailSignature || {}) },
  };
}

function applyProviderPreset(input) {
  const preset = EMAIL_PROVIDERS[input.smtpProvider] || EMAIL_PROVIDERS.custom;
  return {
    ...input,
    smtpHost: input.smtpHost || preset.host,
    smtpPort: input.smtpPort || preset.port,
    smtpEncryption: input.smtpEncryption || preset.encryption,
  };
}

function maskSettings(settings = {}) {
  const copy = { ...settings };
  if (copy.smtpPass) {
    copy.smtpPass = MASK;
    copy.hasSmtpPass = true;
  } else {
    copy.hasSmtpPass = false;
  }
  return copy;
}

async function countEmailsSentToday(companyId) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return EmailLog.countDocuments({
    companyId,
    status: 'sent',
    sentAt: { $gte: start },
  });
}

async function getEmailIntegrationSettings(companyId) {
  const company = await Company.findById(companyId).lean();
  if (!company) throw new Error('Company not found');

  const settings = company.tenantSettings || {};
  const emailsSentToday = await countEmailsSentToday(companyId);
  const dailyLimit = settings.smtpDailyLimit || DAILY_EMAIL_LIMIT;

  return {
    providers: EMAIL_PROVIDERS,
    templateVariables: TEMPLATE_VARIABLES,
    settings: {
      ...maskSettings(settings),
      smtpProvider: settings.smtpProvider || 'smtp',
      smtpFromEmail: settings.smtpFromEmail || settings.smtpUser || '',
      smtpEncryption: settings.smtpEncryption || 'tls',
      smtpReplyTo: settings.smtpReplyTo || '',
      smtpBounceEmail: settings.smtpBounceEmail || '',
      emailStatus: settings.emailStatus || 'not_configured',
      smtpLastTestedAt: settings.smtpLastTestedAt || null,
      smtpVerifiedAt: settings.smtpVerifiedAt || null,
      smtpLastError: settings.smtpLastError || '',
      emailModules: { ...DEFAULT_EMAIL_MODULES, ...(settings.emailModules || {}) },
      emailSignature: {
        ...DEFAULT_EMAIL_SIGNATURE,
        companyName: settings.emailSignature?.companyName || company.name || '',
        address: settings.emailSignature?.address || company.address || '',
        phone: settings.emailSignature?.phone || company.phone || '',
        website: settings.emailSignature?.website || company.website || '',
        logoUrl: settings.emailSignature?.logoUrl || company.logo || '',
        ...(settings.emailSignature || {}),
      },
    },
    status: {
      emailStatus: settings.emailStatus || 'not_configured',
      connectedEmail: settings.smtpFromEmail || settings.smtpUser || '',
      provider: EMAIL_PROVIDERS[settings.smtpProvider]?.label || settings.smtpProvider || '—',
      lastTested: settings.smtpLastTestedAt || null,
      verifiedAt: settings.smtpVerifiedAt || null,
      emailsSentToday,
      remainingDailyLimit: Math.max(0, dailyLimit - emailsSentToday),
      dailyLimit,
    },
  };
}

async function testSmtpConnection(companyId, body, actor) {
  const company = await Company.findById(companyId);
  if (!company) throw new Error('Company not found');

  let input = applyProviderPreset(normalizeSettingsInput(body));
  const existing = company.tenantSettings || {};

  if (!input.smtpHost || !input.smtpUser) {
    throw new Error('SMTP host and username are required');
  }

  let password = body.smtpPass;
  if (!password || password === MASK) {
    password = existing.smtpPass ? decrypt(existing.smtpPass) : '';
  }
  if (!password) throw new Error('SMTP password is required');

  const transport = nodemailer.createTransport(buildTransportConfig({ ...input, smtpPass: password }));
  await transport.verify();

  const to = actor?.email || input.smtpFromEmail || input.smtpUser;
  await transport.sendMail({
    from: `"${input.smtpFromName || company.name}" <${input.smtpFromEmail || input.smtpUser}>`,
    to,
    replyTo: input.smtpReplyTo || input.smtpFromEmail || input.smtpUser,
    subject: `SMTP Test — ${company.name}`,
    html: `
      <div style="font-family:Arial,sans-serif;padding:24px;">
        <h2 style="color:#5b21b6;">SMTP Connected Successfully</h2>
        <p>Your business email <strong>${input.smtpFromEmail || input.smtpUser}</strong> is ready to send CRM emails.</p>
        <p style="color:#64748b;font-size:13px;">Sent at ${new Date().toLocaleString('en-IN')}</p>
      </div>
    `,
    text: 'SMTP test successful. Your business email is ready to send CRM emails.',
  });

  company.tenantSettings = company.tenantSettings || {};
  company.tenantSettings.smtpLastTestedAt = new Date();
  company.tenantSettings.smtpLastError = '';
  company.markModified('tenantSettings');
  await company.save();

  return {
    success: true,
    message: 'SMTP Connected Successfully',
    testedAt: company.tenantSettings.smtpLastTestedAt,
    sentTo: to,
  };
}

async function saveEmailIntegrationSettings(companyId, body) {
  const company = await Company.findById(companyId);
  if (!company) throw new Error('Company not found');

  const existing = company.tenantSettings || {};
  const modulesOnly = body.modulesOnly === true;

  if (modulesOnly && existing.emailStatus === 'verified') {
    company.tenantSettings.emailModules = {
      ...DEFAULT_EMAIL_MODULES,
      ...(existing.emailModules || {}),
      ...(body.emailModules || {}),
    };
    company.tenantSettings.emailSignature = {
      ...DEFAULT_EMAIL_SIGNATURE,
      ...(existing.emailSignature || {}),
      ...(body.emailSignature || {}),
    };
    company.markModified('tenantSettings');
    await company.save();
    return getEmailIntegrationSettings(companyId);
  }

  let input = applyProviderPreset(normalizeSettingsInput(body));

  if (!input.smtpHost || !input.smtpUser || !input.smtpFromEmail) {
    throw new Error('Official email, SMTP host and username are required');
  }

  let password = body.smtpPass;
  if (!password || password === MASK) {
    password = existing.smtpPass ? decrypt(existing.smtpPass) : '';
  }
  if (!password) throw new Error('SMTP password is required');

  const transport = nodemailer.createTransport(buildTransportConfig({ ...input, smtpPass: password }));
  await transport.verify();

  company.tenantSettings = company.tenantSettings || {};
  Object.assign(company.tenantSettings, {
    smtpProvider: input.smtpProvider,
    smtpFromEmail: input.smtpFromEmail,
    smtpHost: input.smtpHost,
    smtpPort: input.smtpPort,
    smtpEncryption: input.smtpEncryption,
    smtpUser: input.smtpUser,
    smtpPass: encrypt(password),
    smtpFromName: input.smtpFromName || company.name,
    smtpReplyTo: input.smtpReplyTo,
    smtpBounceEmail: input.smtpBounceEmail,
    emailModules: input.emailModules,
    emailSignature: input.emailSignature,
    emailStatus: 'verified',
    smtpVerifiedAt: new Date(),
    smtpLastTestedAt: new Date(),
    smtpLastError: '',
    smtpDailyLimit: existing.smtpDailyLimit || DAILY_EMAIL_LIMIT,
  });
  company.markModified('tenantSettings');
  await company.save();
  clearTenantTransporterCache(companyId);

  return getEmailIntegrationSettings(companyId);
}

async function disconnectEmailIntegration(companyId) {
  const company = await Company.findById(companyId);
  if (!company) throw new Error('Company not found');

  company.tenantSettings = company.tenantSettings || {};
  Object.assign(company.tenantSettings, {
    smtpProvider: 'smtp',
    smtpFromEmail: '',
    smtpHost: '',
    smtpPort: 465,
    smtpEncryption: 'ssl',
    smtpUser: '',
    smtpPass: '',
    smtpFromName: '',
    smtpReplyTo: '',
    smtpBounceEmail: '',
    emailStatus: 'not_configured',
    smtpVerifiedAt: null,
    smtpLastTestedAt: null,
    smtpLastError: '',
  });
  company.markModified('tenantSettings');
  await company.save();
  clearTenantTransporterCache(companyId);

  return { success: true, message: 'Email disconnected' };
}

async function listEmailIntegrationLogs(companyId, { page = 1, limit = 20 } = {}) {
  const skip = (Math.max(1, page) - 1) * limit;
  const [items, total] = await Promise.all([
    EmailLog.find({ companyId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    EmailLog.countDocuments({ companyId }),
  ]);

  return {
    items: items.map((log) => ({
      id: log._id,
      recipient: (log.to || []).join(', '),
      subject: log.subject,
      module: log.category,
      status: log.status === 'sent' ? 'delivered' : log.status === 'failed' ? 'failed' : log.status,
      opened: false,
      clicked: false,
      date: log.sentAt || log.createdAt,
      errorMessage: log.errorMessage || '',
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

module.exports = {
  getEmailIntegrationSettings,
  testSmtpConnection,
  saveEmailIntegrationSettings,
  disconnectEmailIntegration,
  listEmailIntegrationLogs,
  EMAIL_PROVIDERS,
};
