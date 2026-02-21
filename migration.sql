-- Create enums
CREATE TYPE "UserRole" AS ENUM ('MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST');
CREATE TYPE "VehicleStatus" AS ENUM ('AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'OUT_OF_SERVICE');
CREATE TYPE "DriverStatus" AS ENUM ('ON_DUTY', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED');
CREATE TYPE "TripStatus" AS ENUM ('DRAFT', 'DISPATCHED', 'COMPLETED', 'CANCELLED');

-- Create tables
CREATE TABLE "User" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Vehicle" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "region" TEXT,
  "licensePlate" TEXT NOT NULL UNIQUE,
  "maxCapacityKg" DECIMAL(10,2) NOT NULL,
  "odometerKm" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "status" "VehicleStatus" NOT NULL DEFAULT 'AVAILABLE',
  "isRetired" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Driver" (
  "id" SERIAL PRIMARY KEY,
  "fullName" TEXT NOT NULL,
  "email" TEXT UNIQUE,
  "phone" TEXT UNIQUE,
  "licenseNumber" TEXT NOT NULL UNIQUE,
  "licenseExpiryDate" TIMESTAMP(3) NOT NULL,
  "licenseCategory" TEXT,
  "status" "DriverStatus" NOT NULL DEFAULT 'ON_DUTY',
  "safetyScore" DECIMAL(5,2),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Trip" (
  "id" SERIAL PRIMARY KEY,
  "referenceCode" TEXT NOT NULL UNIQUE,
  "origin" TEXT NOT NULL,
  "destination" TEXT NOT NULL,
  "cargoWeightKg" DECIMAL(10,2) NOT NULL,
  "status" "TripStatus" NOT NULL DEFAULT 'DRAFT',
  "departureAt" TIMESTAMP(3),
  "arrivalAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "vehicleId" INTEGER NOT NULL,
  "driverId" INTEGER NOT NULL,
  CONSTRAINT "Trip_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Trip_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "MaintenanceLog" (
  "id" SERIAL PRIMARY KEY,
  "vehicleId" INTEGER NOT NULL,
  "serviceType" TEXT NOT NULL,
  "description" TEXT,
  "cost" DECIMAL(10,2),
  "serviceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MaintenanceLog_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "FuelLog" (
  "id" SERIAL PRIMARY KEY,
  "vehicleId" INTEGER NOT NULL,
  "tripId" INTEGER,
  "liters" DECIMAL(10,2) NOT NULL,
  "pricePerLiter" DECIMAL(10,2) NOT NULL,
  "totalCost" DECIMAL(12,2) NOT NULL,
  "filledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FuelLog_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "FuelLog_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Indexes
CREATE INDEX "Trip_vehicleId_idx" ON "Trip"("vehicleId");
CREATE INDEX "Trip_driverId_idx" ON "Trip"("driverId");
CREATE INDEX "Trip_status_idx" ON "Trip"("status");
CREATE INDEX "MaintenanceLog_vehicleId_serviceDate_idx" ON "MaintenanceLog"("vehicleId", "serviceDate");
CREATE INDEX "FuelLog_vehicleId_filledAt_idx" ON "FuelLog"("vehicleId", "filledAt");