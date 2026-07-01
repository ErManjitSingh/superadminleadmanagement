const mongoose = require('mongoose');

const platformApiKeySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    keyPrefix: { type: String, required: true, index: true },
    keyHash: { type: String, required: true, select: false },
    scopes: { type: [String], default: ['companies:read'] },
    status: { type: String, enum: ['active', 'revoked'], default: 'active', index: true },
    lastUsedAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
    revokedAt: { type: Date },
  },
  { timestamps: true, collection: 'platform_api_keys' },
);

module.exports = mongoose.model('PlatformApiKey', platformApiKeySchema);
