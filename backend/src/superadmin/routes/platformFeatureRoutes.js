const express = require('express');
const { superAdminProtect } = require('../middleware/superAdminAuth');
const {
  getPlatformFeatures,
  patchPlatformFeatureDefaults,
  postFeatureRollout,
} = require('../controllers/platformFeatureController');

const router = express.Router();
router.use(superAdminProtect);

router.get('/', getPlatformFeatures);
router.patch('/defaults', patchPlatformFeatureDefaults);
router.post('/rollout', postFeatureRollout);

module.exports = router;
