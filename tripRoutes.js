const express = require('express');
const { getTrips, createTrip, updateTripStatus } = require('../controllers/tripController');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticate);
router.get('/',             authorize('MANAGER', 'DISPATCHER', 'FINANCIAL_ANALYST'), getTrips);
router.post('/',            authorize('MANAGER', 'DISPATCHER'), createTrip);
router.patch('/:id/status', authorize('MANAGER', 'DISPATCHER'), updateTripStatus);

module.exports = router;
