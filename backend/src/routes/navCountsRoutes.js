const express = require('express');
const router = express.Router();
const { getNavCounts } = require('../controllers/navCountsController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getNavCounts);

module.exports = router;
