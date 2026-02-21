const prisma = require('../config/prisma');

async function getTrips(req, res) {
  try {
    const { status, vehicleId, driverId } = req.query;
    const where = {};
    if (status)    where.status    = status;
    if (vehicleId) where.vehicleId = Number(vehicleId);
    if (driverId)  where.driverId  = Number(driverId);

    const trips = await prisma.trip.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        vehicle: { select: { id: true, name: true, licensePlate: true } },
        driver:  { select: { id: true, fullName: true } },
      },
    });

    return res.json(trips);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch trips', error: error.message });
  }
}

async function createTrip(req, res) {
  try {
    const {
      referenceCode, origin, destination, cargoWeightKg,
      vehicleId, driverId, departureAt, notes,
      revenueAmount, asDraft,
    } = req.body;

    if (!referenceCode || !origin || !destination || cargoWeightKg == null || !vehicleId || !driverId) {
      return res.status(400).json({
        message: 'referenceCode, origin, destination, cargoWeightKg, vehicleId and driverId are required',
      });
    }

    const [vehicle, driver] = await Promise.all([
      prisma.vehicle.findUnique({ where: { id: Number(vehicleId) } }),
      prisma.driver.findUnique({ where: { id: Number(driverId) } }),
    ]);

    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    if (!driver)  return res.status(404).json({ message: 'Driver not found' });

    if (Number(cargoWeightKg) > Number(vehicle.maxCapacityKg)) {
      return res.status(400).json({ message: 'Cargo exceeds vehicle max capacity' });
    }

    if (driver.licenseExpiryDate < new Date()) {
      return res.status(400).json({ message: 'Driver license is expired' });
    }

    // Allow DRAFT creation (no status change on vehicle/driver)
    if (!asDraft) {
      if (vehicle.status !== 'AVAILABLE' || vehicle.isRetired) {
        return res.status(400).json({ message: 'Vehicle is not available' });
      }
      if (driver.status !== 'ON_DUTY') {
        return res.status(400).json({ message: 'Driver is not available for dispatch' });
      }
    }

    const trip = await prisma.$transaction(async (tx) => {
      const created = await tx.trip.create({
        data: {
          referenceCode,
          origin,
          destination,
          cargoWeightKg,
          vehicleId:     Number(vehicleId),
          driverId:      Number(driverId),
          departureAt:   departureAt ? new Date(departureAt) : null,
          status:        asDraft ? 'DRAFT' : 'DISPATCHED',
          notes,
          revenueAmount: revenueAmount != null ? Number(revenueAmount) : null,
        },
        include: {
          vehicle: { select: { id: true, name: true, licensePlate: true } },
          driver:  { select: { id: true, fullName: true } },
        },
      });

      if (!asDraft) {
        await tx.vehicle.update({ where: { id: Number(vehicleId) }, data: { status: 'ON_TRIP' } });
        await tx.driver.update({ where: { id: Number(driverId)  }, data: { status: 'ON_TRIP' } });
      }

      return created;
    });

    return res.status(201).json(trip);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create trip', error: error.message });
  }
}

async function updateTripStatus(req, res) {
  try {
    const id = Number(req.params.id);
    const { status, arrivalAt, distanceKm } = req.body;

    const trip = await prisma.trip.findUnique({ where: { id } });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    if (!status) {
      return res.status(400).json({ message: 'status is required' });
    }

    const updatedTrip = await prisma.$transaction(async (tx) => {
      const data = { status };

      if (status === 'DISPATCHED') {
        // DRAFT → DISPATCHED: lock in vehicle and driver
        const [vehicle, driver] = await Promise.all([
          tx.vehicle.findUnique({ where: { id: trip.vehicleId } }),
          tx.driver.findUnique({  where: { id: trip.driverId  } }),
        ]);
        if (vehicle.status !== 'AVAILABLE') {
          throw new Error('Vehicle is no longer available');
        }
        if (driver.status !== 'ON_DUTY') {
          throw new Error('Driver is no longer available');
        }
        await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'ON_TRIP' } });
        await tx.driver.update({  where: { id: trip.driverId  }, data: { status: 'ON_TRIP' } });
        data.departureAt = new Date();
      }

      if (status === 'COMPLETED') {
        data.completedAt  = new Date();
        data.arrivalAt    = arrivalAt ? new Date(arrivalAt) : new Date();
        if (distanceKm != null) data.distanceKm = Number(distanceKm);
      }

      if (status === 'CANCELLED') {
        data.cancelledAt = new Date();
      }

      const updated = await tx.trip.update({
        where: { id },
        data,
        include: {
          vehicle: { select: { id: true, name: true, licensePlate: true } },
          driver:  { select: { id: true, fullName: true } },
        },
      });

      if (status === 'COMPLETED' || status === 'CANCELLED') {
        await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'AVAILABLE' } });
        await tx.driver.update({  where: { id: trip.driverId  }, data: { status: 'ON_DUTY'   } });
      }

      return updated;
    });

    return res.json(updatedTrip);
  } catch (error) {
    const status = error.message.includes('longer available') ? 409 : 500;
    return res.status(status).json({ message: error.message || 'Failed to update trip status' });
  }
}

module.exports = { getTrips, createTrip, updateTripStatus };
