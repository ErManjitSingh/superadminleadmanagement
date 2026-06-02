const express = require('express');
const router = express.Router();
const { getInvite, acceptInvite } = require('../controllers/inviteController');

router.get('/:token', getInvite);
router.post('/accept', acceptInvite);

module.exports = router;
