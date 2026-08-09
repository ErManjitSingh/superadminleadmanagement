const mongoose = require('mongoose');
const { tenantPlugin } = require('../../config/tenantPlugin');

const WORKSPACE_MEMBER_ROLES = [
  'owner',
  'admin',
  'project_manager',
  'team_leader',
  'member',
  'client_viewer',
];

const workspaceMemberSchema = new mongoose.Schema(
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
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: {
      type: String,
      enum: WORKSPACE_MEMBER_ROLES,
      required: true,
      default: 'member',
      index: true,
    },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    joinedAt: { type: Date, default: Date.now },
    notificationPreferences: {
      assignments: { type: Boolean, default: true },
      comments: { type: Boolean, default: true },
      approvals: { type: Boolean, default: true },
      deadlines: { type: Boolean, default: true },
    },
  },
  { timestamps: true, optimisticConcurrency: true },
);

workspaceMemberSchema.index({ companyId: 1, workspaceId: 1, userId: 1 }, { unique: true });
workspaceMemberSchema.index({ companyId: 1, userId: 1, role: 1 });
workspaceMemberSchema.plugin(tenantPlugin);

module.exports = mongoose.model('WorkWorkspaceMember', workspaceMemberSchema);
module.exports.WORKSPACE_MEMBER_ROLES = WORKSPACE_MEMBER_ROLES;
