const prisma = require('../config/prisma');

async function addVehicle(req, res) {
  try {
    const { name, model, type, region, licensePlate, maxCapacityKg, odometerKm } = req.body;

    if (!name || !model || !type || !licensePlate || maxCapacityKg == null) {
      return res.status(400).json({ message: 'name, model, type, licensePlate, maxCapacityKg are required' });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        name,
        model,
        type,
        region,
        licensePlate,
        maxCapacityKg,
        odometerKm: odometerKm ?? 0,
      },
    });

    return res.status(201).json(vehicle);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to add vehicle', error: error.message });
  }
}

async function updateVehicle(req, res) {
  try {
    const id = Number(req.params.id);
    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: req.body,
    });

    return res.json(vehicle);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update vehicle', error: error.message });
  }
}

async function deleteVehicle(req, res) {
  try {
    const id = Number(req.params.id);
    await prisma.vehicle.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete vehicle', error: error.message });
  }
}

async function getVehicles(req, res) {
  try {
    const { status, type, region, availableOnly, search } = req.query;

    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (region) where.region = region;
    if (availableOnly === 'true') {
      where.status = 'AVAILABLE';
      where.isRetired = false;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { licensePlate: { contains: search, mode: 'insensitive' } },
      ];
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return res.json(vehicles);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch vehicles', error: error.message });
  }
}

module.exports = { addVehicle, updateVehicle, deleteVehicle, getVehicles };