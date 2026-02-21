const prisma = require('../config/prisma');

async function getFuelLogs(req, res) {
  try {
    const { vehicleId } = req.query;
    const where = {};
    if (vehicleId) where.vehicleId = Number(vehicleId);

    const logs = await prisma.fuelLog.findMany({
      where,
      orderBy: { filledAt: 'desc' },
      include: { vehicle: { select: { name: true, licensePlate: true } } },
    });

    return res.json(logs);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch fuel logs', error: error.message });
  }
}

async function addFuelLog(req, res) {
  try {
    const { vehicleId, tripId, liters, pricePerLiter, totalCost, odometerDelta, filledAt } = req.body;

    if (!vehicleId || liters == null || pricePerLiter == null) {
      return res.status(400).json({ message: 'vehicleId, liters, pricePerLiter are required' });
    }

    const computedTotal = totalCost != null ? Number(totalCost) : Number(liters) * Number(pricePerLiter);

    const fuelLog = await prisma.fuelLog.create({
      data: {
        vehicleId:    Number(vehicleId),
        tripId:       tripId ? Number(tripId) : null,
        liters,
        pricePerLiter,
        totalCost:    computedTotal,
        odometerDelta: odometerDelta != null ? Number(odometerDelta) : null,
        filledAt:     filledAt ? new Date(filledAt) : undefined,
      },
    });

    return res.status(201).json(fuelLog);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to add fuel log', error: error.message });
  }
}

module.exports = { getFuelLogs, addFuelLog };
