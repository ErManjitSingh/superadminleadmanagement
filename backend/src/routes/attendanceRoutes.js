const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getStatus,
  postCheckIn,
  postCheckOut,
  getMe,
  getToday,
  getSummary,
} = require('../controllers/attendanceController');

router.use(protect);

router.get('/status', getStatus);
router.get('/today', getToday);
router.get('/summary', getSummary);
router.get('/me', getMe);
router.post('/check-in', postCheckIn);
router.post('/check-out', postCheckOut);

module.exports = router;
