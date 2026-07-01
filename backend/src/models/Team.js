const mongoose = require('mongoose');
const { tenantPlugin } = require('../config/tenantPlugin');

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', index: true },
    description: { type: String, default: '' },
    salesManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    teamLeader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

teamSchema.plugin(tenantPlugin);

module.exports = mongoose.model('Team', teamSchema);
