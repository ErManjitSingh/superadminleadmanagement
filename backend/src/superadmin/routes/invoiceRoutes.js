const express = require('express');
const { listInvoices, generateInvoice } = require('../controllers/invoiceController');
const { superAdminProtect } = require('../middleware/superAdminAuth');

const router = express.Router();
router.use(superAdminProtect);

router.get('/', listInvoices);
router.post('/generate', generateInvoice);

module.exports = router;
