const express = require('express');
const { listAdmins, createAdmin, updateProfile } = require('../controllers/adminController');
const { superAdminProtect } = require('../middleware/superAdminAuth');

const router = express.Router();
router.use(superAdminProtect);

router.get('/', listAdmins);
router.post('/', createAdmin);
router.patch('/profile', updateProfile);

module.exports = router;
