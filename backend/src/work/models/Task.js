const mongoose = require('mongoose');
const { tenantPlugin } = require('../../config/tenantPlugin');

const TASK_STATUSES = ['backlog', 'todo', 'in_progress', 'review', 'approved', 'completed'];
const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const TASK_TYPES = ['task', 'bug', 'feature', 'improvement', 'support', 'research'];
const APPROVAL_STATUSES = ['not_submitted', 'pending', 'approved', 'rejected'];

const taskSchema = new mongoose.Schema(
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
    key: { type: String, required: true, uppercase: true, trim: true, maxlength: 24 },
    type: { type: String, enum: TASK_TYPES, default: 'task', index: true },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, trim: true, maxlength: 20000, default: '' },
    assigneeIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      default: [],
      validate: {
        validator: (value) => value.length <= 20,
        message: 'A task can have at most 20 assignees',
      },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    priority: { type: String, enum: TASK_PRIORITIES, default: 'medium', index: true },
    status: { type: String, enum: TASK_STATUSES, default: 'backlog', index: true },
    approvalStatus: {
      type: String,
      enum: APPROVAL_STATUSES,
      default: 'not_submitted',
      index: true,
    },
    startDate: { type: Date, default: null },
    dueDate: { type: Date, default: null, index: true },
    completedAt: { type: Date, default: null },
    estimatedHours: { type: Number, min: 0, max: 100000, default: 0 },
    actualHours: { type: Number, min: 0, max: 100000, default: 0 },
    paymentAmount: { type: Number, min: 0, max: 100000000, default: 0 },
    paymentCurrency: { type: String, enum: ['INR'], default: 'INR' },
    tags: {
      type: [{ type: String, trim: true, maxlength: 40 }],
      default: [],
    },
    order: { type: Number, default: 0, index: true },
    issueDetails: {
      stepsToReproduce: { type: String, trim: true, maxlength: 10000, default: '' },
      expectedResult: { type: String, trim: true, maxlength: 5000, default: '' },
      actualResult: { type: String, trim: true, maxlength: 5000, default: '' },
      environment: { type: String, trim: true, maxlength: 500, default: '' },
    },
    commentCount: { type: Number, min: 0, default: 0 },
    attachmentCount: { type: Number, min: 0, default: 0 },
    subtaskCount: { type: Number, min: 0, default: 0 },
    completedSubtaskCount: { type: Number, min: 0, default: 0 },
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, optimisticConcurrency: true },
);

taskSchema.index({ companyId: 1, key: 1 }, { unique: true });
taskSchema.index({ companyId: 1, projectId: 1, status: 1, order: 1, deletedAt: 1 });
taskSchema.index({ companyId: 1, assigneeIds: 1, status: 1, dueDate: 1, deletedAt: 1 });
taskSchema.index({ companyId: 1, workspaceId: 1, status: 1, priority: 1, deletedAt: 1 });
taskSchema.index({ companyId: 1, approvalStatus: 1, updatedAt: -1, deletedAt: 1 });
taskSchema.plugin(tenantPlugin);

module.exports = mongoose.model('WorkTask', taskSchema);
module.exports.APPROVAL_STATUSES = APPROVAL_STATUSES;
module.exports.TASK_PRIORITIES = TASK_PRIORITIES;
module.exports.TASK_STATUSES = TASK_STATUSES;
module.exports.TASK_TYPES = TASK_TYPES;
