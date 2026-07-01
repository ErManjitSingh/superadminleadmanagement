const express = require('express');
const { listDomains, listPendingDns, getCompanyDomain, connectCompanyDomain, verifyCompanyDomain, refreshCompanyDomain, disconnectCompanyDomain, updateCompanyDomain } = require('../controllers/domainController');
const { superAdminProtect } = require('../middleware/superAdminAuth');

const router = express.Router();
router.use(superAdminProtect);

router.get('/', listDomains);
router.get('/pending', listPendingDns);
router.get('/:id', getCompanyDomain);
router.post('/:id/connect', connectCompanyDomain);
router.post('/:id/verify', verifyCompanyDomain);
router.post('/:id/refresh', refreshCompanyDomain);
router.post('/:id/disconnect', disconnectCompanyDomain);
router.patch('/:id', updateCompanyDomain);

module.exports = router;
