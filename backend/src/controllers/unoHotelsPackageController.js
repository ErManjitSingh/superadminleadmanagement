const asyncHandler = require('../utils/asyncHandler');
const { listUnoPackages, getUnoPackageById } = require('../services/unoHotelsPackageService');

const listPackages = asyncHandler(async (req, res) => {
  const result = await listUnoPackages(req.query);
  res.json(result);
});

const getPackage = asyncHandler(async (req, res) => {
  const pkg = await getUnoPackageById(req.params.id);
  res.json(pkg);
});

module.exports = {
  listPackages,
  getPackage,
};
