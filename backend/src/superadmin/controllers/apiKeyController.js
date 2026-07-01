const crypto = require('crypto');
const PlatformApiKey = require('../models/PlatformApiKey');
const ApiError = require('../../utils/apiError');
const asyncHandler = require('../../utils/asyncHandler');
const { logPlatformAudit } = require('../services/platformAuditService');

const listApiKeys = asyncHandler(async (req, res) => {
  const keys = await PlatformApiKey.find()
    .sort({ createdAt: -1 })
    .select('-keyHash')
    .populate('createdBy', 'name email')
    .lean();
  res.json({ data: keys });
});

const createApiKey = asyncHandler(async (req, res) => {
  const rawKey = `tc_${crypto.randomBytes(24).toString('hex')}`;
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const keyPrefix = rawKey.slice(0, 12);

  const record = await PlatformApiKey.create({
    name: req.body.name || 'API Key',
    keyPrefix,
    keyHash,
    scopes: req.body.scopes || ['companies:read'],
    createdBy: req.superAdmin._id,
  });

  await logPlatformAudit({
    actor: req.superAdmin,
    action: 'api_key_create',
    resourceType: 'platform_api_key',
    resourceId: record._id,
    req,
  });

  res.status(201).json({
    key: {
      id: record._id,
      name: record.name,
      keyPrefix: record.keyPrefix,
      scopes: record.scopes,
      createdAt: record.createdAt,
    },
    secret: rawKey,
  });
});

const revokeApiKey = asyncHandler(async (req, res) => {
  const record = await PlatformApiKey.findById(req.params.id);
  if (!record) throw new ApiError(404, 'API key not found');
  record.status = 'revoked';
  record.revokedAt = new Date();
  await record.save();
  res.json({ message: 'Revoked' });
});

module.exports = { listApiKeys, createApiKey, revokeApiKey };
