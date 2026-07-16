const mongoose = require('mongoose');
const { seoFields } = require('../utils/seoSchema');

const revisionSchema = new mongoose.Schema(
  {
    title: String,
    content: String,
    contentMarkdown: String,
    excerpt: String,
    savedAt: { type: Date, default: Date.now },
    savedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
  },
  { _id: true },
);

const websiteBlogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    excerpt: { type: String, default: '' },
    content: { type: String, default: '' },
    contentMarkdown: { type: String, default: '' },
    editorMode: { type: String, enum: ['richtext', 'markdown'], default: 'richtext' },
    featuredImage: { type: String, default: '' },
    authorName: { type: String, default: '' },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin', default: null },
    categoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WebsiteCategory' }],
    tags: [{ type: String, trim: true }],
    relatedPostIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WebsiteBlog' }],
    revisions: { type: [revisionSchema], default: [] },
    isFeatured: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived', 'scheduled'],
      default: 'draft',
      index: true,
    },
    publishedAt: { type: Date, default: null },
    scheduledAt: { type: Date, default: null },
    lastAutoSavedAt: { type: Date, default: null },
    viewCount: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
    deletedAt: { type: Date, default: null },
    ...seoFields,
  },
  { timestamps: true, collection: 'website_blogs' },
);

websiteBlogSchema.index({ title: 'text', excerpt: 'text', content: 'text' });
websiteBlogSchema.query.notDeleted = function notDeleted() {
  return this.where({ deletedAt: null });
};

module.exports = mongoose.model('WebsiteBlog', websiteBlogSchema);
