function withBranch(filter = {}, branchId = null) {
  if (!branchId) return { ...filter };
  return { ...filter, branchId };
}

module.exports = { withBranch };
