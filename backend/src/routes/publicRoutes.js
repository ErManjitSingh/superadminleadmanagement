const express = require('express');
const { listPublicPlans, publicSignup } = require('../controllers/publicSignupController');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.get('/plans', listPublicPlans);
router.post('/signup', authLimiter, publicSignup);

module.exports = router;
