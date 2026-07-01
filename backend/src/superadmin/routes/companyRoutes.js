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
} = require('../controllers/companyController');
const { superAdminProtect } = require('../middleware/superAdminAuth');

const router = express.Router();

router.use(superAdminProtect);

router.get('/', listCompanies);
router.get('/export', exportCompanies);
router.post('/bulk', bulkAction);
router.get('/:id', getCompany);
router.post('/', createCompany);
router.patch('/:id', updateCompany);
router.delete('/:id', deleteCompany);
router.post('/:id/impersonate', impersonateCompany);

module.exports = router;
