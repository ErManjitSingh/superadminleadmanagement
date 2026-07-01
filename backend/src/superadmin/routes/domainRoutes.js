const express = require('express');
const { listDomains, listPendingDns, verifyCompanyDomain, updateCompanyDomain } = require('../controllers/domainController');
const { superAdminProtect } = require('../middleware/superAdminAuth');

const router = express.Router();
router.use(superAdminProtect);

router.get('/', listDomains);
router.get('/pending', listPendingDns);
router.post('/:id/verify', verifyCompanyDomain);
router.patch('/:id', updateCompanyDomain);

module.exports = router;
