const mongoose = require('mongoose');
const { tenantPlugin } = require('../../config/tenantPlugin');

const PROJECT_MEMBER_ROLES = ['manager', 'team_leader', 'member', 'client_viewer'];

const projectMemberSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkProject',
      required: true,
      index: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: {
      type: String,
      enum: PROJECT_MEMBER_ROLES,
      required: true,
      default: 'member',
      index: true,
    },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, optimisticConcurrency: true },
);

projectMemberSchema.index({ companyId: 1, projectId: 1, userId: 1 }, { unique: true });
projectMemberSchema.index({ companyId: 1, userId: 1, role: 1 });
projectMemberSchema.plugin(tenantPlugin);

module.exports = mongoose.model('WorkProjectMember', projectMemberSchema);
module.exports.PROJECT_MEMBER_ROLES = PROJECT_MEMBER_ROLES;
