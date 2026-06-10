const express = require('express');
const { protect } = require('../middleware/auth');
const { listTargets, upsertTarget } = require('../controllers/salesTargetController');

const router = express.Router();

router.use(protect);

router.get('/', listTargets);
router.post('/', upsertTarget);

module.exports = router;
