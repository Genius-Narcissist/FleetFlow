const bcrypt = require('bcrypt');
const prisma = require('../config/prisma');
const { signToken } = require('../utils/jwt');

async function register(req, res) {
  try {
    const { name, email, password, role = 'DISPATCHER' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return res.status(201).json({ user, token: signToken(user) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to register user', error: error.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    return res.json({ user: safeUser, token: signToken(safeUser) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to login', error: error.message });
  }
}

module.exports = { register, login };