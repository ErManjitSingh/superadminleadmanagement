const express = require('express');
const {
  listCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
  bulkAction,
  impersonateCompany,
  exportCompanies,
  getCompanyUsers,
  resetAdminPassword,
  upgradePlan,
  renewSubscription,
} = require('../controllers/companyController');
const { superAdminProtect } = require('../middleware/superAdminAuth');

const router = express.Router();

router.use(superAdminProtect);

router.get('/', listCompanies);
router.get('/export', exportCompanies);
router.post('/bulk', bulkAction);
router.get('/:id/users', getCompanyUsers);
router.post('/:id/reset-password', resetAdminPassword);
router.post('/:id/upgrade-plan', upgradePlan);
router.post('/:id/renew', renewSubscription);
router.get('/:id', getCompany);
router.post('/', createCompany);
router.patch('/:id', updateCompany);
router.delete('/:id', deleteCompany);
router.post('/:id/impersonate', impersonateCompany);

module.exports = router;
