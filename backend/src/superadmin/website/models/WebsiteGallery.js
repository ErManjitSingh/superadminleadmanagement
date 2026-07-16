const mongoose = require('mongoose');

const websiteGallerySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    images: [
      {
        url: { type: String, required: true },
        alt: { type: String, default: '' },
        caption: { type: String, default: '' },
        sortOrder: { type: Number, default: 0 },
      },
    ],
    trekId: { type: mongoose.Schema.Types.ObjectId, ref: 'WebsiteTrek', default: null },
    destinationId: { type: mongoose.Schema.Types.ObjectId, ref: 'WebsiteDestination', default: null },
    sortOrder: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
      index: true,
    },
    enabled: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'website_galleries' },
);

websiteGallerySchema.query.notDeleted = function notDeleted() {
  return this.where({ deletedAt: null });
};

module.exports = mongoose.model('WebsiteGallery', websiteGallerySchema);
