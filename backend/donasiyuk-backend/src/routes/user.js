// src/routes/user.js
const express = require('express');
const prisma = require('../config/prisma');
const { auth } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /user/me
 * Ambil profil user yang sedang login
 */
router.get('/me', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        totalDonations: true,
        totalPoints: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    res.json(user);
  } catch (err) {
    console.error('GET /user/me error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * PATCH /user/me
 * Update profil user (nama / email)
 * Body (opsional):
 *   - name
 *   - email
 */
router.patch('/me', auth, async (req, res) => {
  const { name, email } = req.body;

  if (!name && !email) {
    return res
      .status(400)
      .json({ message: 'Tidak ada data yang diubah (name / email kosong)' });
  }

  try {
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name ? { name } : {}),
        ...(email ? { email } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        totalDonations: true,
        totalPoints: true,
      },
    });

    res.json({
      message: 'Profil berhasil diperbarui',
      user: updated,
    });
  } catch (err) {
    console.error('PATCH /user/me error:', err);

    // contoh kalau email unique constraint
    if (err.code === 'P2002') {
      return res
        .status(400)
        .json({ message: 'Email sudah digunakan oleh akun lain' });
    }

    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /user/badges
 * Ambil semua badge yang dimiliki user login
 *
 * Asumsi schema:
 *
 * model UserBadge {
 *   id      Int   @id @default(autoincrement())
 *   userId  Int
 *   badgeId Int
 *   user    User  @relation(fields: [userId], references: [id])
 *   badge   Badge @relation(fields: [badgeId], references: [id])
 * }
 *
 * model Badge {
 *   id          Int          @id @default(autoincrement())
 *   name        String
 *   description String?
 *   // ...
 *   users       UserBadge[]
 * }
 */
router.get('/badges', auth, async (req, res) => {
  try {
    const userBadges = await prisma.userBadge.findMany({
      where: { userId: req.user.id }, // ganti userBadge kalau nama model join kamu beda
      include: {
        badge: true, // pastikan di model join ada field "badge"
      },
      orderBy: { id: 'desc' },
    });

    const badges = userBadges
      .map((ub) => ub.badge)
      .filter(Boolean);

    res.json(badges);
  } catch (err) {
    console.error('GET /user/badges error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
