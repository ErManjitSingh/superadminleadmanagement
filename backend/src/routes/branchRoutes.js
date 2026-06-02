const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { listBranches, createBranch } = require('../controllers/branchController');

router.use(protect);

router.get('/', listBranches);
router.post('/', authorize('admin'), createBranch);

module.exports = router;
