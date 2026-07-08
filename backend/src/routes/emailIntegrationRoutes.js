const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const {
  getSettings,
  testSmtp,
  saveSettings,
  updateSettings,
  disconnect,
  getLogs,
} = require('../controllers/emailIntegrationController');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/settings', getSettings);
router.put('/settings', updateSettings);
router.post('/test', testSmtp);
router.post('/save', saveSettings);
router.delete('/disconnect', disconnect);
router.get('/logs', getLogs);

module.exports = router;
