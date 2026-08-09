const mongoose = require('mongoose');
const { tenantPlugin } = require('../../config/tenantPlugin');

const commentSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkWorkspace', required: true, index: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkProject', required: true, index: true },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkTask', required: true, index: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    body: { type: String, required: true, trim: true, maxlength: 10000 },
    parentCommentId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkComment', default: null, index: true },
    mentionIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      default: [],
      validate: {
        validator: (value) => value.length <= 50,
        message: 'A comment can mention at most 50 users',
      },
    },
    editedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, optimisticConcurrency: true },
);

commentSchema.index({ companyId: 1, taskId: 1, createdAt: 1, deletedAt: 1 });
commentSchema.index({ companyId: 1, parentCommentId: 1, createdAt: 1 });
commentSchema.index({ companyId: 1, mentionIds: 1, createdAt: -1 });
commentSchema.plugin(tenantPlugin);

module.exports = mongoose.model('WorkComment', commentSchema);
