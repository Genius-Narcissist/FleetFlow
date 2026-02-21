const express = require('express');
const { addFuelLog, getFuelLogs } = require('../controllers/fuelController');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticate);
router.get('/',  authorize('MANAGER', 'DISPATCHER', 'FINANCIAL_ANALYST'), getFuelLogs);  // ← added
router.post('/', authorize('MANAGER', 'DISPATCHER', 'FINANCIAL_ANALYST'), addFuelLog);

module.exports = router;
