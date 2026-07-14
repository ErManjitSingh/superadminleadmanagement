const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const Vendor = require('../models/Vendor');
const { protect } = require('../middleware/auth');
const { tenantFilter, companyScopedIdFilter, assertTenantDocument } = require('../utils/tenantDocument');

router.use(protect);

const listVendors = asyncHandler(async (req, res) => {
  const filter = tenantFilter({}, req);
  if (req.query.type) {
    filter.type = req.query.type === 'cab' ? 'transport' : req.query.type;
  }
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) {
    const q = String(req.query.search).trim();
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { destination: { $regex: q, $options: 'i' } },
      { location: { $regex: q, $options: 'i' } },
    ];
  }
  const vendors = await Vendor.find(filter).sort({ name: 1 }).lean();
  res.json(vendors);
});

const createVendor = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (body.type === 'cab') body.type = 'transport';
  const vendor = await Vendor.create({ status: 'active', rating: 4.0, ...body });
  res.status(201).json(vendor);
});

const updateVendor = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (body.type === 'cab') body.type = 'transport';
  const vendor = await Vendor.findOneAndUpdate(companyScopedIdFilter(req.params.id, req), body, { new: true });
  assertTenantDocument(vendor, req, 'Vendor');
  res.json(vendor);
});

const deleteVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne(companyScopedIdFilter(req.params.id, req));
  assertTenantDocument(vendor, req, 'Vendor');
  await vendor.deleteOne();
  res.json({ message: 'Vendor deleted' });
});

router.route('/').get(listVendors).post(createVendor);
router.route('/:id').put(updateVendor).delete(deleteVendor);

module.exports = router;
