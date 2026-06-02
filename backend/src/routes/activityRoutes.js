const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const asyncHandler = require('../utils/asyncHandler');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const activities = await Activity.find({ status: 'active' })
      .sort({ name: 1 })
      .lean();
    res.json(activities);
  })
);

module.exports = router;
