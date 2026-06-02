const Branch = require('../models/Branch');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');

const listBranches = asyncHandler(async (req, res) => {
  let filter = { status: 'active' };
  if (req.user?.role !== 'admin') {
    filter = { _id: req.user.branchId };
  }

  const branches = await Branch.find(filter).sort({ name: 1 }).lean();
  res.json(branches);
});

const createBranch = asyncHandler(async (req, res) => {
  const { name, code, status } = req.body;
  if (!name?.trim() || !code?.trim()) throw new ApiError(400, 'Name and code are required');

  const exists = await Branch.findOne({
    $or: [{ name: name.trim() }, { code: code.trim().toUpperCase() }],
  });
  if (exists) throw new ApiError(400, 'Branch already exists');

  const branch = await Branch.create({
    name: name.trim(),
    code: code.trim().toUpperCase(),
    status: status || 'active',
  });
  res.status(201).json(branch);
});

module.exports = { listBranches, createBranch };
