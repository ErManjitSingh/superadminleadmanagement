const express = require('express');
const router = express.Router();
const {
  listUsers,
  getUser,
  getUserProfile,
  createUser,
  updateUser,
  deleteUser,
  inviteUser,
  resetPassword,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.post('/invite', authorize('admin'), inviteUser);
router.post('/reset-password/:id', authorize('admin'), resetPassword);
router.get('/:id/profile', getUserProfile);
router.get('/', listUsers);
router.post('/', authorize('admin'), createUser);
router.get('/:id', getUser);
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;
