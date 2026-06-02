const express = require('express');
const router = express.Router();
const {
  listTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  listTeamLeaders,
  listAvailableExecutives,
  addMember,
  removeMember,
  transferMember,
  updateTeamLeader,
} = require('../controllers/teamController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.get('/leaders', listTeamLeaders);
router.get('/available-executives', listAvailableExecutives);
router.post('/:id/members', addMember);
router.delete('/:id/members/:memberId', removeMember);
router.put('/:id/transfer', transferMember);
router.put('/:id/leader', updateTeamLeader);
router.route('/').get(listTeams).post(authorize('sales_manager', 'admin'), createTeam);
router
  .route('/:id')
  .get(getTeam)
  .put(authorize('sales_manager', 'admin'), updateTeam)
  .delete(authorize('sales_manager', 'admin'), deleteTeam);

module.exports = router;
