const mongoose = require('mongoose');

const { tenantPlugin } = require('../config/tenantPlugin');
const assignmentRoundRobinSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    lastIndex: { type: Number, default: -1 },
    lastUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

assignmentRoundRobinSchema.plugin(tenantPlugin);

module.exports = mongoose.model('AssignmentRoundRobin', assignmentRoundRobinSchema);
