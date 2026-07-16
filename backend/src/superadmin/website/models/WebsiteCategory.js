const mongoose = require('mongoose');
const { seoFields } = require('../utils/seoSchema');

const websiteCategorySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    banner: { type: String, default: '' },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'WebsiteCategory', default: null },
    type: {
      type: String,
      enum: ['trek', 'blog', 'destination', 'general'],
      default: 'trek',
      index: true,
    },
    sortOrder: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
      index: true,
    },
    enabled: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
    deletedAt: { type: Date, default: null },
    ...seoFields,
  },
  { timestamps: true, collection: 'website_categories' },
);

websiteCategorySchema.query.notDeleted = function notDeleted() {
  return this.where({ deletedAt: null });
};

module.exports = mongoose.model('WebsiteCategory', websiteCategorySchema);
