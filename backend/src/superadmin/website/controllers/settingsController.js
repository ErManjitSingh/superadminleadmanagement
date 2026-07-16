const WebsiteSettings = require('../models/WebsiteSettings');
const asyncHandler = require('../../../utils/asyncHandler');
const { applyAllowed } = require('../utils/formatters');
const { logWebsiteActivity } = require('../services/websiteActivityService');

function sanitizeSettings(doc) {
  const p = doc.toObject ? doc.toObject() : doc;
  const smtp = { ...(p.smtp || {}) };
  if (smtp.password) smtp.password = '••••••••';
  return {
    id: p._id,
    key: p.key,
    logo: p.logo || '',
    favicon: p.favicon || '',
    businessName: p.businessName || '',
    emails: p.emails || {},
    phone: p.phone || '',
    whatsapp: p.whatsapp || '',
    address: p.address || '',
    googleAnalyticsId: p.googleAnalyticsId || '',
    googleTagManagerId: p.googleTagManagerId || '',
    googleSearchConsole: p.googleSearchConsole || '',
    metaPixelId: p.metaPixelId || '',
    smtp,
    socialLinks: p.socialLinks || {},
    copyright: p.copyright || '',
    maintenanceMode: !!p.maintenanceMode,
    updatedAt: p.updatedAt,
  };
}

async function getOrCreate() {
  let settings = await WebsiteSettings.findOne({ key: 'default' });
  if (!settings) {
    settings = await WebsiteSettings.create({ key: 'default', businessName: 'Trek Website' });
  }
  return settings;
}

const getSettings = asyncHandler(async (req, res) => {
  const settings = await getOrCreate();
  res.json({ settings: sanitizeSettings(settings) });
});

const updateSettings = asyncHandler(async (req, res) => {
  const settings = await getOrCreate();
  applyAllowed(settings, req.body, [
    'logo', 'favicon', 'businessName', 'emails', 'phone', 'whatsapp', 'address',
    'googleAnalyticsId', 'googleTagManagerId', 'googleSearchConsole', 'metaPixelId',
    'socialLinks', 'copyright', 'maintenanceMode',
  ]);

  if (req.body.smtp && typeof req.body.smtp === 'object') {
    const next = { ...(settings.smtp?.toObject?.() || settings.smtp || {}), ...req.body.smtp };
    if (req.body.smtp.password === '••••••••' || req.body.smtp.password === undefined) {
      delete next.password;
      next.password = settings.smtp?.password || '';
    }
    settings.smtp = next;
  }

  settings.updatedBy = req.superAdmin?._id;
  await settings.save();

  await logWebsiteActivity({
    actor: req.superAdmin,
    action: 'updated',
    resourceType: 'settings',
    resourceId: settings._id,
    title: 'Website settings',
    req,
  });

  res.json({ settings: sanitizeSettings(settings) });
});

module.exports = { getSettings, updateSettings, sanitizeSettings, getOrCreate };
