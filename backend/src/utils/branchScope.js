const mongoose = require('mongoose');

function normalizeBranchId(branchId) {
  if (!branchId) return null;
  if (branchId instanceof mongoose.Types.ObjectId) return branchId;
  const raw = String(branchId).trim();
  if (!raw || !mongoose.Types.ObjectId.isValid(raw)) return branchId;
  return new mongoose.Types.ObjectId(raw);
}

function withBranch(filter = {}, branchId = null) {
  if (!branchId) return { ...filter };
  return { ...filter, branchId: normalizeBranchId(branchId) };
}

module.exports = { withBranch, normalizeBranchId };
