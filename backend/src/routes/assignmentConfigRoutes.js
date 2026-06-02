const express = require('express');
const router = express.Router();
const { getAssignmentStatus } = require('../controllers/assignmentConfigController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/status', getAssignmentStatus);

module.exports = router;
