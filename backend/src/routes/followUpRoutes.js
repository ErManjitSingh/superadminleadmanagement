const express = require('express');
const router = express.Router();
const {
  listFollowUps,
  getFollowUpSummary,
  getFollowUp,
  createFollowUp,
  updateFollowUp,
  deleteFollowUp,
} = require('../controllers/followUpController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const requireExecutiveForWrite = authorize('sales_executive');

router.use(protect);

router.get('/summary', getFollowUpSummary);
router.route('/').get(listFollowUps).post(requireExecutiveForWrite, createFollowUp);
router
  .route('/:id')
  .get(getFollowUp)
  .put(requireExecutiveForWrite, updateFollowUp)
  .delete(requireExecutiveForWrite, deleteFollowUp);

module.exports = router;
