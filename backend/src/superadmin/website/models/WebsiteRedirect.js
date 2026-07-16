const mongoose = require('mongoose');

const websiteRedirectSchema = new mongoose.Schema(
  {
    fromPath: { type: String, required: true, trim: true, unique: true, index: true },
    toPath: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['301', '302', '410'],
      default: '301',
      index: true,
    },
    hitCount: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    is404Handler: { type: Boolean, default: false },
    enabled: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'website_redirects' },
);

websiteRedirectSchema.query.notDeleted = function notDeleted() {
  return this.where({ deletedAt: null });
};

module.exports = mongoose.model('WebsiteRedirect', websiteRedirectSchema);
