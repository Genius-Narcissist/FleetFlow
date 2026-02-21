const express = require('express');
const { getMaintenance, addMaintenanceLog, completeMaintenance } = require('../controllers/maintenanceController');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticate);
router.get('/',               authorize('MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'), getMaintenance);
router.post('/',              authorize('MANAGER'), addMaintenanceLog);
router.patch('/:id/complete', authorize('MANAGER'), completeMaintenance);

module.exports = router;
