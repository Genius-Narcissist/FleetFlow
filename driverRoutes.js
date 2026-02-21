const express = require('express');
const { getDrivers, addDriver, checkLicenseExpiry, updateDriverStatus } = require('../controllers/driverController');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticate);
router.get('/',    authorize('MANAGER', 'DISPATCHER', 'SAFETY_OFFICER'), getDrivers);
router.post('/',   authorize('MANAGER', 'SAFETY_OFFICER'), addDriver);
router.get('/:id/license-expiry', authorize('MANAGER', 'SAFETY_OFFICER', 'DISPATCHER'), checkLicenseExpiry);
router.patch('/:id/status', authorize('MANAGER', 'SAFETY_OFFICER'), updateDriverStatus);

module.exports = router;
