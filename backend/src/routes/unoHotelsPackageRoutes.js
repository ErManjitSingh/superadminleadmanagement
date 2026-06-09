const express = require('express');
const { listPackages, getPackage } = require('../controllers/unoHotelsPackageController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/', listPackages);
router.get('/:id', getPackage);

module.exports = router;
