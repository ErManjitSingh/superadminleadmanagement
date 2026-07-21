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

const requireFollowUpWriteRole = authorize('sales_executive', 'admin');

router.use(protect);

router.get('/summary', getFollowUpSummary);
router.route('/').get(listFollowUps).post(requireFollowUpWriteRole, createFollowUp);
router
  .route('/:id')
  .get(getFollowUp)
  .put(requireFollowUpWriteRole, updateFollowUp)
  .delete(requireFollowUpWriteRole, deleteFollowUp);

module.exports = router;
