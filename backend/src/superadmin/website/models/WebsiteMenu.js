const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    url: { type: String, default: '/' },
    type: {
      type: String,
      enum: ['custom', 'trek', 'destination', 'blog', 'page', 'category'],
      default: 'custom',
    },
    targetId: { type: mongoose.Schema.Types.ObjectId, default: null },
    openInNewTab: { type: Boolean, default: false },
    icon: { type: String, default: '' },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    sortOrder: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true },
    children: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { _id: true },
);

const websiteMenuSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    location: {
      type: String,
      enum: ['header', 'footer', 'mega', 'mobile', 'sidebar'],
      required: true,
    },
    items: { type: [menuItemSchema], default: [] },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'published',
    },
    enabled: { type: Boolean, default: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
  },
  { timestamps: true, collection: 'website_menus' },
);

websiteMenuSchema.index({ location: 1 }, { unique: true });

module.exports = mongoose.model('WebsiteMenu', websiteMenuSchema);
