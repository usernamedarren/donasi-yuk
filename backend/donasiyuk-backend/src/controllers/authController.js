// src/controllers/authController.js
const prisma = require('../config/prisma');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// 🔥 Generate JWT
function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,   // penting untuk admin
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// =======================
// 👉 REGISTER
// =======================
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // cek email sudah dipakai?
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'Email sudah terdaftar' });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hash,
        role: 'USER',    // default
      },
    });

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Error register user' });
  }
};

// =======================
// 👉 LOGIN
// =======================
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,   // <== untuk cek admin
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login gagal' });
  }
};

// =======================
// 👉 AUTH ME (logged-in user info)
// =======================
exports.me = async (req, res) => {
  // req.user sudah di-set OSH oleh auth.js
  res.json(req.user);
};
