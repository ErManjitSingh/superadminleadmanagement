const express = require('express');
const {
  listPlans,
  getPlan,
  createPlan,
  updatePlan,
  deletePlan,
} = require('../controllers/planController');
const { superAdminProtect } = require('../middleware/superAdminAuth');

const router = express.Router();

router.use(superAdminProtect);

router.get('/', listPlans);
router.get('/:id', getPlan);
router.post('/', createPlan);
router.patch('/:id', updatePlan);
router.delete('/:id', deletePlan);

module.exports = router;
