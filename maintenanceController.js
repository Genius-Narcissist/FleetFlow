const prisma = require('../config/prisma');

async function getMaintenance(req, res) {
  try {
    const { vehicleId } = req.query;
    const where = {};
    if (vehicleId) where.vehicleId = Number(vehicleId);

    const logs = await prisma.maintenanceLog.findMany({
      where,
      orderBy: { serviceDate: 'desc' },
      include: { vehicle: { select: { name: true, licensePlate: true } } },
    });

    return res.json(logs);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch maintenance logs', error: error.message });
  }
}

async function addMaintenanceLog(req, res) {
  try {
    const { vehicleId, serviceType, description, cost, serviceDate } = req.body;

    if (!vehicleId || !serviceType) {
      return res.status(400).json({ message: 'vehicleId and serviceType are required' });
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id: Number(vehicleId) } });
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const log = await prisma.$transaction(async (tx) => {
      const created = await tx.maintenanceLog.create({
        data: {
          vehicleId:   Number(vehicleId),
          serviceType,
          description,
          cost:        cost != null ? Number(cost) : null,
          serviceDate: serviceDate ? new Date(serviceDate) : undefined,
        },
        include: { vehicle: { select: { name: true, licensePlate: true } } },
      });

      await tx.vehicle.update({ where: { id: Number(vehicleId) }, data: { status: 'IN_SHOP' } });
      return created;
    });

    return res.status(201).json(log);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to add maintenance log', error: error.message });
  }
}

async function completeMaintenance(req, res) {
  try {
    const id = Number(req.params.id);

    const log = await prisma.maintenanceLog.findUnique({ where: { id } });
    if (!log) {
      return res.status(404).json({ message: 'Maintenance log not found' });
    }

    if (log.resolvedAt) {
      return res.status(409).json({ message: 'Maintenance log already completed' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.maintenanceLog.update({
        where: { id },
        data:  { resolvedAt: new Date() },
        include: { vehicle: { select: { name: true, licensePlate: true } } },
      });

      // Only mark Available if vehicle is still in IN_SHOP state
      const vehicle = await tx.vehicle.findUnique({ where: { id: log.vehicleId } });
      if (vehicle.status === 'IN_SHOP') {
        await tx.vehicle.update({ where: { id: log.vehicleId }, data: { status: 'AVAILABLE' } });
      }

      return result;
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to complete maintenance', error: error.message });
  }
}

module.exports = { getMaintenance, addMaintenanceLog, completeMaintenance };
