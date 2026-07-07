const Company = require('../models/Company');
const PlatformSettings = require('../models/PlatformSettings');
const ApiError = require('../../utils/apiError');
const {
  FEATURE_KEYS,
  FEATURE_LABELS,
  DEFAULT_FEATURES,
  normalizeFeaturePatch,
  mergeFeatures,
} = require('../../config/featureFlags');
const { logPlatformAudit } = require('./platformAuditService');

const DEFAULTS_KEY = 'default_feature_flags';

async function getDefaultFeatureFlags() {
  const row = await PlatformSettings.findOne({ key: DEFAULTS_KEY }).lean();
  if (!row?.value || typeof row.value !== 'object') {
    return { ...DEFAULT_FEATURES };
  }
  return mergeFeatures({}, row.value);
}

async function saveDefaultFeatureFlags(features, superAdminId) {
  const patch = normalizeFeaturePatch(features);
  if (!Object.keys(patch).length) {
    throw new ApiError(400, 'No valid feature flags provided');
  }
  const current = await getDefaultFeatureFlags();
  const merged = mergeFeatures(current, patch);

  await PlatformSettings.findOneAndUpdate(
    { key: DEFAULTS_KEY },
    {
      $set: {
        key: DEFAULTS_KEY,
        value: merged,
        category: 'features',
        label: 'Default feature flags for new companies',
        updatedBy: superAdminId,
      },
    },
    { upsert: true, new: true },
  );

  return merged;
}

async function getFeatureRolloutStats() {
  const companies = await Company.find({ deletedAt: null, isLegacy: { $ne: true } })
    .select('features name')
    .lean();

  const byFeature = {};
  for (const key of FEATURE_KEYS) {
    let enabled = 0;
    let disabled = 0;
    for (const c of companies) {
      const val = c.features?.[key];
      if (val === false) disabled += 1;
      else enabled += 1;
    }
    byFeature[key] = { enabled, disabled, total: companies.length };
  }

  return {
    totalCompanies: companies.length,
    byFeature,
  };
}

async function rolloutFeatures({ features, scope, companyIds, actor, req }) {
  const patch = normalizeFeaturePatch(features);
  if (!Object.keys(patch).length) {
    throw new ApiError(400, 'Select at least one feature to update');
  }

  const set = {};
  for (const [key, val] of Object.entries(patch)) {
    set[`features.${key}`] = val;
  }

  let filter = { deletedAt: null, isLegacy: { $ne: true } };
  if (scope === 'selected') {
    if (!Array.isArray(companyIds) || !companyIds.length) {
      throw new ApiError(400, 'Select at least one company');
    }
    filter._id = { $in: companyIds };
  } else if (scope !== 'all') {
    throw new ApiError(400, 'Invalid rollout scope');
  }

  const result = await Company.updateMany(filter, { $set: set });
  const updated = result.modifiedCount ?? result.nModified ?? 0;

  await logPlatformAudit({
    actor,
    action: 'feature_rollout',
    resourceType: 'platform',
    metadata: { scope, companyIds: scope === 'selected' ? companyIds : null, features: patch, updated },
    req,
  });

  return { updated, features: patch, scope };
}

function listFeatureDefinitions() {
  return FEATURE_KEYS.map((key) => ({
    key,
    label: FEATURE_LABELS[key] || key,
    defaultEnabled: DEFAULT_FEATURES[key] !== false,
  }));
}

module.exports = {
  getDefaultFeatureFlags,
  saveDefaultFeatureFlags,
  getFeatureRolloutStats,
  rolloutFeatures,
  listFeatureDefinitions,
  DEFAULTS_KEY,
};
