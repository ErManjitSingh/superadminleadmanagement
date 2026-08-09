const mongoose = require('mongoose');
const { tenantPlugin } = require('../../config/tenantPlugin');

const approvalSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkWorkspace', required: true, index: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkProject', required: true, index: true },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkTask', required: true, index: true },
    revision: { type: Number, min: 1, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
      index: true,
    },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    submissionNote: { type: String, trim: true, maxlength: 5000, default: '' },
    submittedAt: { type: Date, default: Date.now },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewNote: { type: String, trim: true, maxlength: 5000, default: '' },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true, optimisticConcurrency: true },
);

approvalSchema.index({ companyId: 1, taskId: 1, revision: 1 }, { unique: true });
approvalSchema.index({ companyId: 1, status: 1, submittedAt: -1 });
approvalSchema.index({ companyId: 1, projectId: 1, status: 1, submittedAt: -1 });
approvalSchema.index(
  { companyId: 1, taskId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } },
);
approvalSchema.plugin(tenantPlugin);

module.exports = mongoose.model('WorkApproval', approvalSchema);
