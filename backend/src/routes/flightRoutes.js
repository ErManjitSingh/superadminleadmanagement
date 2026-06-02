const express = require('express');
const router = express.Router();
const {
  listFlights,
  createFlight,
  updateFlight,
  deleteFlight,
} = require('../controllers/packageController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(listFlights).post(createFlight);
router.route('/:id').put(updateFlight).delete(deleteFlight);

module.exports = router;
