const asyncHandler = require('../../utils/asyncHandler');
const {
  getDefaultFeatureFlags,
  saveDefaultFeatureFlags,
  getFeatureRolloutStats,
  rolloutFeatures,
  listFeatureDefinitions,
} = require('../services/platformFeatureService');

const getPlatformFeatures = asyncHandler(async (req, res) => {
  const [defaults, stats] = await Promise.all([
    getDefaultFeatureFlags(),
    getFeatureRolloutStats(),
  ]);
  res.json({
    data: {
      defaults,
      stats,
      features: listFeatureDefinitions(),
    },
  });
});

const patchPlatformFeatureDefaults = asyncHandler(async (req, res) => {
  const merged = await saveDefaultFeatureFlags(req.body?.features || req.body, req.superAdmin._id);
  res.json({ data: { defaults: merged } });
});

const postFeatureRollout = asyncHandler(async (req, res) => {
  const { features, scope, companyIds } = req.body;
  const result = await rolloutFeatures({
    features,
    scope: scope || 'all',
    companyIds,
    actor: req.superAdmin,
    req,
  });
  res.json({ data: result, message: `Updated ${result.updated} companies` });
});

module.exports = {
  getPlatformFeatures,
  patchPlatformFeatureDefaults,
  postFeatureRollout,
};
