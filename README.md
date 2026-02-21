+# FleetFlow Backend
+
+Node.js + Express.js + PostgreSQL + Prisma backend for fleet and logistics management.
+
+## Where is the database?
+
+This repo now includes a **real PostgreSQL database setup** and **versioned SQL schema**:
+
+- PostgreSQL service via Docker Compose: `docker-compose.yml`
+- Prisma schema: `prisma/schema.prisma`
+- Initial SQL migration (actual table creation): `prisma/migrations/20260221043000_init/migration.sql`
+
+So the database is **PostgreSQL**, and the full schema exists both as Prisma models and executable SQL migration files.
+
+## Setup
+
+1. Install dependencies:
+   ```bash
+   npm install
+   ```
+2. Copy environment file:
+   ```bash
+   cp .env.example .env
+   ```
+3. Start PostgreSQL:
+   ```bash
+   docker compose up -d postgres
+   ```
+4. Initialize database schema:
+   ```bash
+   npx prisma generate
+   npx prisma migrate dev
+   ```
+   Or apply the SQL migration directly with Prisma deploy flow:
+   ```bash
+   npx prisma migrate deploy
+   ```
+5. Start server:
+   ```bash
+   npm run dev
+   ```
+
+## Implemented Modules
+
+- Authentication: register/login with bcrypt + JWT
+- Users, Vehicles, Drivers, Trips, MaintenanceLogs, FuelLogs schema with relations and constraints
+- Vehicles API: add, update, delete, list with filters
+- Drivers API: add, check license expiry, update status
+- Trips API: capacity/license/availability validation + automatic status updates
+- Maintenance API: add log and auto-mark vehicle as `IN_SHOP`
+- Fuel API: add log with automatic `totalCost` calculation
+
+## API Routes
+
+- `POST /api/auth/register`
+- `POST /api/auth/login`
+- `POST /api/vehicles`
+- `PATCH /api/vehicles/:id`
+- `DELETE /api/vehicles/:id`
+- `GET /api/vehicles?status=&type=&region=&availableOnly=true&search=`
+- `POST /api/drivers`
+- `GET /api/drivers/:id/license-expiry`
+- `PATCH /api/drivers/:id/status`
+- `POST /api/trips`
+- `PATCH /api/trips/:id/status`
+- `POST /api/maintenance`
+- `POST /api/fuel`
+
+All non-auth routes require bearer token.
