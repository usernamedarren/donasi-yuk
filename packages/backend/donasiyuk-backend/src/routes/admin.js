// src/routes/admin.js
const express = require('express');
const prisma = require('../config/prisma');
const { auth } = require('../middleware/auth');

const router = express.Router();

/**
 * Middleware: pastikan user role-nya ADMIN
 */
function isAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden: Admin only.' });
  }
  next();
}

/**
 * GET /admin/campaigns/pending
 * Ambil semua campaign status PENDING untuk diverifikasi admin
 */
router.get('/campaigns/pending', auth, isAdmin, async (req, res) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { status: 'PENDING' },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(campaigns);
  } catch (err) {
    console.error('GET /admin/campaigns/pending error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * PUT /admin/campaigns/:id/approve
 * Ubah status campaign menjadi PUBLISHED + set approvedAt
 */
router.put('/campaigns/:id/approve', auth, isAdmin, async (req, res) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: 'ID campaign tidak valid' });
  }

  try {
    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        approvedAt: new Date(),
      },
    });

    res.json({
      message: 'Campaign disetujui & dipublish.',
      campaign,
    });
  } catch (err) {
    console.error('PUT /admin/campaigns/:id/approve error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * PUT /admin/campaigns/:id/reject
 * Ubah status campaign menjadi REJECTED
 */
router.put('/campaigns/:id/reject', auth, isAdmin, async (req, res) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: 'ID campaign tidak valid' });
  }

  try {
    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        status: 'REJECTED',
      },
    });

    res.json({
      message: 'Campaign ditolak.',
      campaign,
    });
  } catch (err) {
    console.error('PUT /admin/campaigns/:id/reject error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
