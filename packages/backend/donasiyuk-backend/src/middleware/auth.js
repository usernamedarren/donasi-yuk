// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // payload MUST contain userId (id), role optional
    const userId = payload.userId || payload.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // pasang user ke req agar bisa dipakai route
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (err) {
    console.error('auth middleware error:', err);
    res.status(401).json({ message: 'Unauthorized' });
  }
};

// ✔️ DIREFAKTOR — cukup satu saja!
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden: admin only' });
  }
  next();
};

module.exports = {
  auth,
  requireAdmin,
};
