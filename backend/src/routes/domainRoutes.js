const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const {
  verifyCompanyDomain,
  connectCompanyDomain,
  disconnectCompanyDomain,
  refreshCompanyDomainStatus,
  getCompanyDomainStatus,
} = require('../controllers/domainController');

const router = express.Router();

router.use(protect);
router.get('/status', authorize('admin'), getCompanyDomainStatus);
router.post('/verify', authorize('admin'), verifyCompanyDomain);
router.post('/connect', authorize('admin'), connectCompanyDomain);
router.post('/disconnect', authorize('admin'), disconnectCompanyDomain);
router.post('/refresh', authorize('admin'), refreshCompanyDomainStatus);

module.exports = router;
