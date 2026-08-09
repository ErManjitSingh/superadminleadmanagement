const mongoose = require('mongoose');
const { tenantPlugin } = require('../../config/tenantPlugin');

const subTaskSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkWorkspace',
      required: true,
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkProject',
      required: true,
      index: true,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkTask',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    completed: { type: Boolean, default: false, index: true },
    assigneeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    dueDate: { type: Date, default: null },
    order: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    completedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, optimisticConcurrency: true },
);

subTaskSchema.index({ companyId: 1, taskId: 1, order: 1, deletedAt: 1 });
subTaskSchema.index({ companyId: 1, assigneeId: 1, completed: 1, dueDate: 1, deletedAt: 1 });
subTaskSchema.plugin(tenantPlugin);

module.exports = mongoose.model('WorkSubTask', subTaskSchema);
