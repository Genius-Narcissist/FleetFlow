const express = require('express');
const { addVehicle, updateVehicle, deleteVehicle, getVehicles } = require('../controllers/vehicleController');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticate);
router.post('/', authorize('MANAGER', 'DISPATCHER'), addVehicle);
router.patch('/:id', authorize('MANAGER', 'DISPATCHER'), updateVehicle);
router.delete('/:id', authorize('MANAGER'), deleteVehicle);
router.get('/', authorize('MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'), getVehicles);

module.exports = router;