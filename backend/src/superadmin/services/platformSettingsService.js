const PlatformSettings = require('../models/PlatformSettings');

const DEFAULT_SETTINGS = [
  { key: 'platform_name', value: 'Travel CRM', category: 'general', label: 'Platform Name' },
  { key: 'default_currency', value: 'INR', category: 'general', label: 'Default Currency' },
  { key: 'default_timezone', value: 'Asia/Kolkata', category: 'general', label: 'Default Timezone' },
  { key: 'default_trial_days', value: 7, category: 'billing', label: 'Default Trial Days' },
  { key: 'maintenance_mode', value: false, category: 'general', label: 'Maintenance Mode' },
  { key: 'smtp_host', value: '', category: 'smtp', label: 'SMTP Host' },
  { key: 'smtp_port', value: 465, category: 'smtp', label: 'SMTP Port' },
  { key: 'smtp_user', value: '', category: 'smtp', label: 'SMTP User' },
  { key: 'smtp_pass', value: '', category: 'smtp', label: 'SMTP Password', isSecret: true },
  { key: 'whatsapp_api_url', value: '', category: 'whatsapp', label: 'WhatsApp API URL' },
  { key: 'whatsapp_api_key', value: '', category: 'whatsapp', label: 'WhatsApp API Key', isSecret: true },
  { key: 'sms_gateway_url', value: '', category: 'sms', label: 'SMS Gateway URL' },
  { key: 'cloudinary_cloud_name', value: '', category: 'storage', label: 'Cloudinary Cloud Name' },
  { key: 'cloudinary_api_key', value: '', category: 'storage', label: 'Cloudinary API Key', isSecret: true },
  { key: 'aws_region', value: '', category: 'storage', label: 'AWS Region' },
  { key: 'google_maps_api_key', value: '', category: 'maps', label: 'Google Maps API Key', isSecret: true },
  { key: 'platform_logo_url', value: '', category: 'branding', label: 'Platform Logo URL' },
  { key: 'platform_favicon_url', value: '', category: 'branding', label: 'Platform Favicon URL' },
];

async function ensureDefaultSettings() {
  for (const item of DEFAULT_SETTINGS) {
    await PlatformSettings.findOneAndUpdate(
      { key: item.key },
      { $setOnInsert: item },
      { upsert: true }
    );
  }
}

async function getSettingsMap() {
  await ensureDefaultSettings();
  const rows = await PlatformSettings.find().lean();
  return Object.fromEntries(rows.map((r) => [r.key, maskSecret(r)]));
}

function maskSecret(row) {
  const obj = { ...row };
  if (obj.isSecret && obj.value) {
    obj.value = '••••••••';
    obj.hasValue = true;
  }
  return obj;
}

async function getSettingsByCategory(category) {
  await ensureDefaultSettings();
  const filter = category ? { category } : {};
  const rows = await PlatformSettings.find(filter).sort({ key: 1 }).lean();
  return rows.map(maskSecret);
}

async function updateSettings(updates, superAdminId) {
  const results = [];
  for (const [key, value] of Object.entries(updates)) {
    if (value === '••••••••') continue;
    const row = await PlatformSettings.findOneAndUpdate(
      { key },
      { value, updatedBy: superAdminId },
      { new: true }
    );
    if (row) results.push(maskSecret(row.toObject()));
  }
  return results;
}

module.exports = {
  ensureDefaultSettings,
  getSettingsMap,
  getSettingsByCategory,
  updateSettings,
  DEFAULT_SETTINGS,
};
