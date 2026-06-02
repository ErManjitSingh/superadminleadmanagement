const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const {
  listSkills,
  listUserSkills,
  updateUserSkills,
  getBranchSkillSettings,
  updateBranchSkillSettings,
  listSkillAssignmentLogs,
  getReports,
  detectLeadTypePreview,
  triggerSkillAutoAssign,
} = require('../controllers/skillAssignmentController');

router.use(protect);

router.get('/skills', authorize('admin', 'sales_manager'), listSkills);
router.get('/user-skills', authorize('admin', 'sales_manager'), listUserSkills);
router.put('/user-skills', authorize('admin', 'sales_manager'), updateUserSkills);

router.get('/branch-settings', authorize('admin', 'sales_manager'), getBranchSkillSettings);
router.put('/branch-settings', authorize('admin', 'sales_manager'), updateBranchSkillSettings);

router.get('/logs', authorize('admin', 'sales_manager'), listSkillAssignmentLogs);
router.get('/reports', authorize('admin', 'sales_manager'), getReports);
router.post('/detect-lead-type', authorize('admin', 'sales_manager', 'team_leader'), detectLeadTypePreview);
router.post('/auto-assign/:leadId', authorize('admin', 'sales_manager'), triggerSkillAutoAssign);

module.exports = router;
