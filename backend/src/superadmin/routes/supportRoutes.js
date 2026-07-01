const express = require('express');
const { listTickets, getTicket, createTicket, updateTicket } = require('../controllers/supportController');
const { superAdminProtect } = require('../middleware/superAdminAuth');

const router = express.Router();
router.use(superAdminProtect);

router.get('/', listTickets);
router.post('/', createTicket);
router.get('/:id', getTicket);
router.patch('/:id', updateTicket);

module.exports = router;
