const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/requirePermission');
const {
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} = require('../controllers/whatsappTemplateController');

router.use(protect);

router.get('/', requirePermission('whatsapp', 'use'), listTemplates);
router.post('/', requirePermission('whatsapp', 'manage'), createTemplate);
router.put('/:id', requirePermission('whatsapp', 'manage'), updateTemplate);
router.delete('/:id', requirePermission('whatsapp', 'manage'), deleteTemplate);

module.exports = router;
