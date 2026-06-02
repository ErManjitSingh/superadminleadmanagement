const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const {
  listDestinations,
  createDestination,
  updateDestination,
  deleteDestination,
  listUserMappings,
  updateUserMappings,
  getBranchAssignmentSettings,
  updateBranchAssignmentSettings,
  listAssignmentLogs,
  getReports,
  triggerAutoAssign,
} = require('../controllers/destinationAssignmentController');

router.use(protect);

router.get('/destinations', authorize('admin', 'sales_manager'), listDestinations);
router.post('/destinations', authorize('admin'), createDestination);
router.put('/destinations/:id', authorize('admin'), updateDestination);
router.delete('/destinations/:id', authorize('admin'), deleteDestination);

router.get('/user-mappings', authorize('admin', 'sales_manager'), listUserMappings);
router.put('/user-mappings', authorize('admin', 'sales_manager'), updateUserMappings);

router.get('/branch-settings', authorize('admin', 'sales_manager'), getBranchAssignmentSettings);
router.put('/branch-settings', authorize('admin', 'sales_manager'), updateBranchAssignmentSettings);

router.get('/logs', authorize('admin', 'sales_manager'), listAssignmentLogs);
router.get('/reports', authorize('admin', 'sales_manager'), getReports);

router.post('/auto-assign/:leadId', authorize('admin', 'sales_manager'), triggerAutoAssign);

module.exports = router;
