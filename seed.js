// backend/src/seed.js
require('dotenv').config();
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('password123', 10);
  await prisma.user.upsert({
    where: { email: 'manager@fleetflow.io' },
    update: {},
    create: { name: 'Admin', email: 'manager@fleetflow.io', passwordHash: hash, role: 'MANAGER' },
  });
  console.log('Seeded admin user: manager@fleetflow.io / password123');
}

main().catch(console.error).finally(() => prisma.$disconnect());