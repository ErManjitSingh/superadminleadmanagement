const express = require('express');
const router = express.Router();
const { login, logout, getMe, register, registerPushToken } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/login', authLimiter, login);
router.post('/register', protect, register);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.post('/push-token', protect, registerPushToken);

module.exports = router;
