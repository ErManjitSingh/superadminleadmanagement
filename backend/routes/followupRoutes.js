const express = require('express');
const router = express.Router();
const {
  getFollowups,
  getFollowup,
  createFollowup,
  updateFollowup,
  deleteFollowup,
} = require('../controllers/followupController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getFollowups).post(createFollowup);
router.route('/:id').get(getFollowup).put(updateFollowup).delete(deleteFollowup);

module.exports = router;
