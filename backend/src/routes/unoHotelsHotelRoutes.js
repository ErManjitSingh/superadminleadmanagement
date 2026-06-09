const express = require('express');
const { listHotels, getHotelDetail } = require('../controllers/unoHotelsHotelController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/', listHotels);
router.get('/detail', getHotelDetail);

module.exports = router;
