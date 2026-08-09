const mongoose = require('mongoose');
const { tenantPlugin } = require('../../config/tenantPlugin');

const attachmentSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkWorkspace', required: true, index: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkProject', required: true, index: true },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkTask', required: true, index: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    originalName: { type: String, required: true, trim: true, maxlength: 255 },
    storageKey: { type: String, required: true, unique: true },
    mimeType: { type: String, required: true, trim: true, maxlength: 150 },
    size: { type: Number, required: true, min: 1, max: 25 * 1024 * 1024 },
    checksum: { type: String, required: true, minlength: 64, maxlength: 64 },
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, optimisticConcurrency: true },
);

attachmentSchema.index({ companyId: 1, taskId: 1, createdAt: -1, deletedAt: 1 });
attachmentSchema.index({ companyId: 1, uploadedBy: 1, createdAt: -1 });
attachmentSchema.plugin(tenantPlugin);

module.exports = mongoose.model('WorkAttachment', attachmentSchema);
