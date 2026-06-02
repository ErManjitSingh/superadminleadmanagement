const express = require('express');
const router = express.Router();
const { getTeamPerformance } = require('../controllers/teamController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/performance', getTeamPerformance);

module.exports = router;
