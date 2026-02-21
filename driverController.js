const prisma = require('../config/prisma');

async function getDrivers(req, res) {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;

    const drivers = await prisma.driver.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { trips: true } } },
    });

    return res.json(drivers);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch drivers', error: error.message });
  }
}

async function addDriver(req, res) {
  try {
    const { fullName, email, phone, licenseNumber, licenseExpiryDate, licenseCategory, status, safetyScore } = req.body;

    if (!fullName || !licenseNumber || !licenseExpiryDate) {
      return res.status(400).json({ message: 'fullName, licenseNumber, licenseExpiryDate are required' });
    }

    const driver = await prisma.driver.create({
      data: {
        fullName,
        email:             email || null,
        phone:             phone || null,
        licenseNumber,
        licenseExpiryDate: new Date(licenseExpiryDate),
        licenseCategory,
        status,
        safetyScore:       safetyScore != null ? Number(safetyScore) : null,
      },
      include: { _count: { select: { trips: true } } },
    });

    return res.status(201).json(driver);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to add driver', error: error.message });
  }
}

async function checkLicenseExpiry(req, res) {
  try {
    const id = Number(req.params.id);
    const driver = await prisma.driver.findUnique({ where: { id } });

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    const expired = driver.licenseExpiryDate < new Date();
    return res.json({ driverId: id, licenseExpiryDate: driver.licenseExpiryDate, expired });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to check license expiry', error: error.message });
  }
}

async function updateDriverStatus(req, res) {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'status is required' });
    }

    const driver = await prisma.driver.update({
      where: { id },
      data: { status },
      include: { _count: { select: { trips: true } } },
    });

    return res.json(driver);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update driver status', error: error.message });
  }
}

module.exports = { getDrivers, addDriver, checkLicenseExpiry, updateDriverStatus };
