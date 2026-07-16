const mongoose = require('mongoose');

const websiteMediaSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    originalName: { type: String, default: '' },
    url: { type: String, required: true },
    mimeType: { type: String, default: '' },
    size: { type: Number, default: 0 },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    folder: { type: String, default: 'root', index: true },
    alt: { type: String, default: '' },
    title: { type: String, default: '' },
    caption: { type: String, default: '' },
    format: { type: String, default: '' },
    webpUrl: { type: String, default: '' },
    avifUrl: { type: String, default: '' },
    tags: [{ type: String }],
    usedIn: [{ type: String }],
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'website_media' },
);

websiteMediaSchema.index({ originalName: 'text', alt: 'text', title: 'text', caption: 'text' });
websiteMediaSchema.index({ folder: 1, createdAt: -1 });
websiteMediaSchema.query.notDeleted = function notDeleted() {
  return this.where({ deletedAt: null });
};

module.exports = mongoose.model('WebsiteMedia', websiteMediaSchema);
