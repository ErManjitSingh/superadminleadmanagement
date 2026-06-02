const express = require('express');
const router = express.Router();
const {
  listRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
} = require('../controllers/roleController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(listRoles).post(createRole);
router.route('/:id').get(getRole).put(updateRole).delete(deleteRole);

module.exports = router;
