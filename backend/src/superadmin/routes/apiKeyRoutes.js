const express = require('express');
const { listApiKeys, createApiKey, revokeApiKey } = require('../controllers/apiKeyController');
const { superAdminProtect } = require('../middleware/superAdminAuth');

const router = express.Router();
router.use(superAdminProtect);

router.get('/', listApiKeys);
router.post('/', createApiKey);
router.post('/:id/revoke', revokeApiKey);

module.exports = router;
