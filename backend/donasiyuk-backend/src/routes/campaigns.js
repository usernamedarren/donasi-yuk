// src/routes/campaigns.js
const express = require('express');
const prisma = require('../config/prisma');
const { auth } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /campaigns
 * USER: buat campaign baru (status PENDING)
 */
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, goalAmount } = req.body;

    if (!title || !description || !goalAmount) {
      return res.status(400).json({
        message: 'title, description, dan goalAmount wajib diisi',
      });
    }

    const goal = Number(goalAmount);
    if (!goal || goal <= 0) {
      return res
        .status(400)
        .json({ message: 'goalAmount harus berupa angka > 0' });
    }

    const campaign = await prisma.campaign.create({
      data: {
        title,
        description,
        goalAmount: goal,     // ⬅ SESUAI SCHEMA (bukan targetAmount)
        collectedAmount: 0,
        status: 'PENDING',    // menunggu verifikasi admin
        ownerId: req.user.id, // ⬅ KAMPANYE INI MILIK USER INI
      },
    });

    res.status(201).json({
      message: 'Campaign dibuat, menunggu verifikasi admin',
      campaign,
    });
  } catch (err) {
    console.error('POST /campaigns error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /campaigns/me
 * USER: semua kampanye milik user login (untuk profil & bagian bawah halaman kampanye)
 */
router.get('/me', auth, async (req, res) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { ownerId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json(campaigns);
  } catch (err) {
    console.error('GET /campaigns/me error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /campaigns
 * PUBLIC: list kampanye yang sudah dipublish (halaman kampanye umum)
 */
router.get('/', async (req, res) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { status: 'PUBLISHED' }, // hanya yang sudah di-approve admin
      include: {
        owner: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(campaigns);
  } catch (err) {
    console.error('GET /campaigns error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /campaigns/:id
 * PUBLIC: detail kampanye
 */
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ message: 'ID campaign tidak valid' });
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true } },
        donations: true,
      },
    });

    if (!campaign)
      return res.status(404).json({ message: 'Campaign tidak ditemukan' });

    res.json(campaign);
  } catch (err) {
    console.error('GET /campaigns/:id error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
