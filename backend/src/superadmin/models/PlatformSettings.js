const mongoose = require('mongoose');

const platformSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: mongoose.Schema.Types.Mixed, default: null },
    category: {
      type: String,
      enum: ['general', 'smtp', 'whatsapp', 'sms', 'storage', 'maps', 'branding', 'billing'],
      default: 'general',
      index: true,
    },
    label: { type: String, trim: true },
    isSecret: { type: Boolean, default: false },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
  },
  { timestamps: true, collection: 'platform_settings' }
);

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);
