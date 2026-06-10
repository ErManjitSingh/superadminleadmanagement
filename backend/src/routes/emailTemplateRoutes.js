const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/requirePermission');
const {
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} = require('../controllers/emailTemplateController');

router.use(protect);

router.get('/', requirePermission('email', 'send'), listTemplates);
router.post('/', requirePermission('email', 'manage'), createTemplate);
router.put('/:id', requirePermission('email', 'manage'), updateTemplate);
router.delete('/:id', requirePermission('email', 'manage'), deleteTemplate);

module.exports = router;
