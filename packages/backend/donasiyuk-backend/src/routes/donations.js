// src/routes/donations.js
const express = require('express');
const prisma = require('../config/prisma');
const { auth } = require('../middleware/auth');
const { addPoints } = require('../services/pointsService');
const { checkAndAssignBadges } = require('../services/badgeService');

const router = express.Router();

/**
 * POST /donations
 * Buat donasi baru untuk sebuah campaign
 * Body: { campaignId, amount }
 */
router.post('/', auth, async (req, res) => {
  const { campaignId, amount } = req.body;

  try {
    // 1. Validasi campaign
    const campaign = await prisma.campaign.findUnique({
      where: { id: Number(campaignId) },
    });

    if (!campaign || campaign.status !== 'PUBLISHED') {
      return res
        .status(400)
        .json({ message: 'Campaign tidak valid atau belum dipublish' });
    }

    // 2. Validasi nominal
    const nominal = Number(amount);
    if (!nominal || nominal <= 0) {
      return res
        .status(400)
        .json({ message: 'Nominal donasi tidak valid' });
    }

    // 3. Transaksi: simpan donasi + update campaign + update totalDonations user
    const result = await prisma.$transaction(async (tx) => {
      const donation = await tx.donation.create({
        data: {
          userId: req.user.id,
          campaignId: campaign.id,
          amount: nominal,
          status: 'SUCCESS', // status string biasa (bukan enum)
        },
      });

      const updatedCampaign = await tx.campaign.update({
        where: { id: campaign.id },
        data: {
          collectedAmount: { increment: nominal },
        },
      });

      const updatedUser = await tx.user.update({
        where: { id: req.user.id },
        data: {
          totalDonations: { increment: nominal },
        },
      });

      return { donation, updatedCampaign, updatedUser };
    });

    // 4. Tambah poin dari donasi
    const pointsEarned = Math.floor(nominal / 1000); // contoh: 1 poin per 1000 rupiah
    if (pointsEarned > 0) {
      await addPoints(
        req.user.id,
        pointsEarned,
        `Poin dari donasi Rp${nominal}`
      );
    }

    // 5. Cek & kasih badge jika memenuhi syarat
    await checkAndAssignBadges(req.user.id);

    res.status(201).json({
      message: 'Donasi berhasil',
      donation: result.donation,
      campaign: result.updatedCampaign,
    });
  } catch (err) {
    console.error('POST /donations error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /donations/me
 * Ambil semua donasi milik user yang sedang login
 * Dipakai di halaman profil (total donasi + riwayat donasi)
 */
router.get('/me', auth, async (req, res) => {
  try {
    const donations = await prisma.donation.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    res.json(donations);
  } catch (err) {
    console.error('GET /donations/me error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * (Opsional) GET /donations/campaign/:campaignId
 * Semua donasi untuk campaign tertentu
 * Bisa dipakai nanti kalau mau bikin halaman admin/owner kampanye
 */
router.get('/campaign/:campaignId', auth, async (req, res) => {
  const campaignId = Number(req.params.campaignId);

  try {
    const donations = await prisma.donation.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json(donations);
  } catch (err) {
    console.error('GET /donations/campaign/:campaignId error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
