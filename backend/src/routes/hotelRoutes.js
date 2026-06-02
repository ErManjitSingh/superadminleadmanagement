const express = require('express');
const router = express.Router();
const {
  listHotels,
  createHotel,
  updateHotel,
  deleteHotel,
} = require('../controllers/packageController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(listHotels).post(createHotel);
router.route('/:id').put(updateHotel).delete(deleteHotel);

module.exports = router;
