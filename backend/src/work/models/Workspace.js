const mongoose = require('mongoose');
const { tenantPlugin } = require('../../config/tenantPlugin');

const workspaceSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, lowercase: true, trim: true },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    color: { type: String, trim: true, default: '#177245' },
    icon: { type: String, trim: true, maxlength: 40, default: 'briefcase' },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
      index: true,
    },
    settings: {
      allowMemberTaskCreation: { type: Boolean, default: false },
      requireTaskApproval: { type: Boolean, default: true },
      defaultProjectVisibility: {
        type: String,
        enum: ['workspace', 'members'],
        default: 'workspace',
      },
    },
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, optimisticConcurrency: true },
);

workspaceSchema.index({ companyId: 1, slug: 1 }, { unique: true });
workspaceSchema.index({ companyId: 1, status: 1, deletedAt: 1, updatedAt: -1 });
workspaceSchema.plugin(tenantPlugin);

module.exports = mongoose.model('WorkWorkspace', workspaceSchema);
