const express = require('express');
const { protect } = require('../middleware/auth');
const { generateItinerary } = require('../controllers/aiItineraryController');

const router = express.Router();

router.use(protect);
router.post('/generate', generateItinerary);

module.exports = router;
