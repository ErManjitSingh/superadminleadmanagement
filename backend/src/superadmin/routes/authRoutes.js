const express = require('express');
const { login, getMe, logout } = require('../controllers/superAdminAuthController');
const { superAdminProtect } = require('../middleware/superAdminAuth');

const router = express.Router();

router.post('/login', login);
router.get('/me', superAdminProtect, getMe);
router.post('/logout', superAdminProtect, logout);

module.exports = router;
