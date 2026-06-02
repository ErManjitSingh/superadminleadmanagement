const mongoose = require('mongoose');

const assignmentRoundRobinSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    lastIndex: { type: Number, default: -1 },
    lastUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AssignmentRoundRobin', assignmentRoundRobinSchema);
