const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const {
  getCompanySettings,
  getOnboarding,
  getSubscriptionLimits,
  requestPlanUpgrade,
  getRenewalInfo,
  submitRenewalPayment,
  updateCompanySettings,
  verifyCompanyDomain,
  updateCompanyDomain,
  removeCompanyDomain,
  resendVerification,
} = require('../controllers/companySettingsController');

const router = express.Router();

router.use(protect);
router.get('/', getCompanySettings);
router.get('/subscription', getSubscriptionLimits);
router.get('/renewal-info', getRenewalInfo);
router.post('/renewal-payment', authorize('admin'), submitRenewalPayment);
router.post('/upgrade-request', authorize('admin'), requestPlanUpgrade);
router.get('/onboarding', getOnboarding);
router.post('/resend-verification', authorize('admin'), resendVerification);
router.post('/domain/verify', authorize('admin'), verifyCompanyDomain);
router.patch('/domain', authorize('admin'), updateCompanyDomain);
router.delete('/domain', authorize('admin'), removeCompanyDomain);
router.patch('/', authorize('admin'), updateCompanySettings);

module.exports = router;
