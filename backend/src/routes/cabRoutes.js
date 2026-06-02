const express = require('express');
const router = express.Router();
const {
  listCabs,
  createCab,
  updateCab,
  deleteCab,
} = require('../controllers/packageController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(listCabs).post(createCab);
router.route('/:id').put(updateCab).delete(deleteCab);

module.exports = router;
