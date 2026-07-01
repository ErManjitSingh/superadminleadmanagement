const mongoose = require('mongoose');

const { tenantPlugin } = require('../config/tenantPlugin');
const branchAssignmentSettingsSchema = new mongoose.Schema(
  {
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true, unique: true },
    autoAssignEnabled: { type: Boolean, default: false },
    skillAutoAssignEnabled: { type: Boolean, default: false },
    fallbackUserIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    salesManagerQueueIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    fallbackRoundRobinIndex: { type: Number, default: -1 },
  },
  { timestamps: true }
);

branchAssignmentSettingsSchema.plugin(tenantPlugin);

module.exports = mongoose.model('BranchAssignmentSettings', branchAssignmentSettingsSchema);
