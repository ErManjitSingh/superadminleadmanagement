const mongoose = require('mongoose');
const { tenantPlugin } = require('../../config/tenantPlugin');

const workActivityLogSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkWorkspace', required: true, index: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkProject', required: true, index: true },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkTask', required: true, index: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true, trim: true, maxlength: 100, index: true },
    summary: { type: String, required: true, trim: true, maxlength: 500 },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

workActivityLogSchema.index({ companyId: 1, taskId: 1, createdAt: -1 });
workActivityLogSchema.index({ companyId: 1, projectId: 1, createdAt: -1 });
workActivityLogSchema.index({ companyId: 1, actorId: 1, createdAt: -1 });
workActivityLogSchema.plugin(tenantPlugin);

module.exports = mongoose.model('WorkActivityLog', workActivityLogSchema);
