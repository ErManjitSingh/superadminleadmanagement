const asyncHandler = require('../../utils/asyncHandler');
const { getSettingsByCategory, updateSettings } = require('../services/platformSettingsService');
const { logPlatformAudit } = require('../services/platformAuditService');

const getSettings = asyncHandler(async (req, res) => {
  const category = req.query.category;
  const settings = await getSettingsByCategory(category);
  res.json({ data: settings });
});

const patchSettings = asyncHandler(async (req, res) => {
  const updates = req.body.settings || req.body;
  const data = await updateSettings(updates, req.superAdmin._id);

  await logPlatformAudit({
    actor: req.superAdmin,
    action: 'update',
    resourceType: 'platform_settings',
    metadata: { keys: Object.keys(updates) },
    req,
  });

  res.json({ data });
});

module.exports = { getSettings, patchSettings };
