const mongoose = require('mongoose');

const websiteSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'default' },
    logo: { type: String, default: '' },
    favicon: { type: String, default: '' },
    businessName: { type: String, default: '' },
    emails: {
      primary: { type: String, default: '' },
      support: { type: String, default: '' },
      bookings: { type: String, default: '' },
    },
    phone: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    address: { type: String, default: '' },
    googleAnalyticsId: { type: String, default: '' },
    googleTagManagerId: { type: String, default: '' },
    googleSearchConsole: { type: String, default: '' },
    metaPixelId: { type: String, default: '' },
    smtp: {
      host: { type: String, default: '' },
      port: { type: Number, default: 587 },
      secure: { type: Boolean, default: false },
      user: { type: String, default: '' },
      password: { type: String, default: '' },
      fromName: { type: String, default: '' },
      fromEmail: { type: String, default: '' },
    },
    socialLinks: {
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
      youtube: { type: String, default: '' },
      twitter: { type: String, default: '' },
      linkedin: { type: String, default: '' },
    },
    copyright: { type: String, default: '' },
    maintenanceMode: { type: Boolean, default: false },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
  },
  { timestamps: true, collection: 'website_settings' },
);

module.exports = mongoose.model('WebsiteSettings', websiteSettingsSchema);
