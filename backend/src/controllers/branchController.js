const Branch = require('../models/Branch');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const { withCompany } = require('../utils/branchScope');

const listBranches = asyncHandler(async (req, res) => {
  let filter = withCompany({ status: 'active' }, req.companyId);
  if (req.user?.role !== 'admin') {
    filter = { ...filter, _id: req.user.branchId };
  }

  const branches = await Branch.find(filter).sort({ name: 1 }).lean();
  res.json(branches);
});

const createBranch = asyncHandler(async (req, res) => {
  const { name, code, status } = req.body;
  if (!name?.trim() || !code?.trim()) throw new ApiError(400, 'Name and code are required');

  const exists = await Branch.findOne(
    withCompany({
      $or: [{ name: name.trim() }, { code: code.trim().toUpperCase() }],
    }, req.companyId)
  );
  if (exists) throw new ApiError(400, 'Branch already exists');

  const branch = await Branch.create({
    name: name.trim(),
    code: code.trim().toUpperCase(),
    status: status || 'active',
    companyId: req.companyId,
  });
  res.status(201).json(branch);
});

module.exports = { listBranches, createBranch };
