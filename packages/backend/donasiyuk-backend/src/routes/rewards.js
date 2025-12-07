// src/routes/rewards.js
const express = require('express');
const prisma = require('../config/prisma');
const { auth } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /rewards/volunteer
 * Ambil daftar reward volunteer yang aktif.
 * Tidak perlu login (public).
 */
router.get('/volunteer', async (req, res) => {
  try {
    const rewards = await prisma.reward.findMany({
      where: {
        type: 'VOLUNTEER',   // sesuai dengan kolom "type" di Prisma Studio
        isActive: true,      // pastikan field ini ada di schema
      },
      orderBy: {
        costPoints: 'asc',   // kolom di tabel kamu
      },
    });

    res.json(rewards);
  } catch (err) {
    console.error('GET /rewards/volunteer error:', err);
    res.status(500).json({ message: 'Gagal mengambil volunteer rewards' });
  }
});

/**
 * POST /rewards/redeem
 * Tukar poin user dengan reward volunteer.
 * Body: { rewardId }
 */
router.post('/redeem', auth, async (req, res) => {
  const userId = req.user.id;
  const { rewardId } = req.body;

  if (!rewardId) {
    return res.status(400).json({ message: 'rewardId wajib diisi' });
  }

  try {
    const reward = await prisma.reward.findUnique({
      where: { id: Number(rewardId) },
    });

    if (!reward) {
      return res.status(404).json({ message: 'Reward tidak ditemukan' });
    }

    if (!reward.isActive) {
      return res.status(400).json({ message: 'Reward tidak aktif' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    const userPoints = user.totalPoints ?? 0;
    const cost = reward.costPoints ?? 0;  // pakai costPoints

    if (userPoints < cost) {
      return res.status(400).json({
        code: 'NOT_ENOUGH_POINTS',
        message: 'Poin tidak mencukupi untuk menukar reward ini',
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          totalPoints: userPoints - cost,
        },
      });

      const redemption = await tx.rewardRedemption.create({
        data: {
          userId,
          rewardId: reward.id,
          status: 'PENDING', // sesuaikan dengan enum/status di schema
        },
      });

      return { updatedUser, redemption };
    });

    return res.status(201).json({
      message: 'Berhasil menukar reward untuk volunteer',
      user: {
        id: result.updatedUser.id,
        totalPoints: result.updatedUser.totalPoints,
      },
      reward,
      redemption: result.redemption,
    });
  } catch (err) {
    console.error('POST /rewards/redeem error:', err);
    res.status(500).json({ message: 'Gagal menukar reward' });
  }
});

/**
 * GET /rewards/redemptions/me
 * Riwayat penukaran reward (termasuk volunteer) milik user login
 */
router.get('/redemptions/me', auth, async (req, res) => {
  try {
    const redemptions = await prisma.rewardRedemption.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        reward: {
          select: {
            id: true,
            name: true,
            description: true,
            costPoints: true,
            type: true,
          },
        },
      },
    });

    res.json(redemptions);
  } catch (err) {
    console.error('GET /rewards/redemptions/me error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
