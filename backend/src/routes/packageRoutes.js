const express = require('express');
const router = express.Router();
const {
  listPackages,
  getPackage,
  createPackage,
  updatePackage,
  deletePackage,
  duplicatePackage,
  archivePackage,
  publishPackage,
  savePackageVersion,
  restorePackageVersion,
  incrementPackageViews,
  listHotels,
  createHotel,
  updateHotel,
  deleteHotel,
  listCabs,
  createCab,
  updateCab,
  deleteCab,
  listFlights,
  createFlight,
  updateFlight,
  deleteFlight,
} = require('../controllers/packageController');
const { protect } = require('../middleware/auth');
const { requireFeature } = require('../middleware/requireFeature');

router.use(protect);
router.use(requireFeature('packages'));

router.post('/duplicate/:id', duplicatePackage);
router.post('/:id/archive', archivePackage);
router.post('/:id/publish', publishPackage);
router.post('/:id/versions', savePackageVersion);
router.post('/:id/versions/:versionId/restore', restorePackageVersion);
router.post('/:id/view', incrementPackageViews);
router.route('/').get(listPackages).post(createPackage);
router.route('/:id').get(getPackage).put(updatePackage).delete(deletePackage);

module.exports = router;
