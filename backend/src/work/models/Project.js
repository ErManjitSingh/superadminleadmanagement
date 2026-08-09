const mongoose = require('mongoose');
const { tenantPlugin } = require('../../config/tenantPlugin');

const PROJECT_STATUSES = [
  'planning',
  'not_started',
  'in_progress',
  'on_hold',
  'completed',
  'archived',
];

const PROJECT_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const projectSchema = new mongoose.Schema(
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
    key: { type: String, required: true, uppercase: true, trim: true, maxlength: 12 },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 5000, default: '' },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startDate: { type: Date, default: null },
    dueDate: { type: Date, default: null, index: true },
    priority: { type: String, enum: PROJECT_PRIORITIES, default: 'medium', index: true },
    status: { type: String, enum: PROJECT_STATUSES, default: 'planning', index: true },
    color: { type: String, trim: true, default: '#177245' },
    icon: { type: String, trim: true, maxlength: 40, default: 'folder-kanban' },
    tags: {
      type: [{ type: String, trim: true, maxlength: 40 }],
      default: [],
    },
    visibility: {
      type: String,
      enum: ['workspace', 'members'],
      default: 'workspace',
    },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    completedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, optimisticConcurrency: true },
);

projectSchema.index({ companyId: 1, key: 1 }, { unique: true });
projectSchema.index({ companyId: 1, workspaceId: 1, status: 1, deletedAt: 1, updatedAt: -1 });
projectSchema.index({ companyId: 1, managerId: 1, status: 1, deletedAt: 1 });
projectSchema.index({ companyId: 1, dueDate: 1, status: 1, deletedAt: 1 });
projectSchema.plugin(tenantPlugin);

module.exports = mongoose.model('WorkProject', projectSchema);
module.exports.PROJECT_PRIORITIES = PROJECT_PRIORITIES;
module.exports.PROJECT_STATUSES = PROJECT_STATUSES;
