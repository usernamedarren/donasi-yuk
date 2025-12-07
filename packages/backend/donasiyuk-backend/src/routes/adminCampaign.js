// src/routes/adminCampaign.js
const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { auth, requireAdmin } = require('../middleware/auth');

// GET /admin/campaigns?status=PENDING | PUBLISHED | REJECTED | ALL
router.get('/campaigns', auth, requireAdmin, async (req, res) => {
  const { status } = req.query;

  const where =
    status && status !== 'ALL'
      ? { status }
      : {}; // kalau ALL / kosong → semua status

  try {
    const campaigns = await prisma.campaign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: {           // sesuaikan nama relasi di schema (user / owner)
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.json(campaigns);
  } catch (err) {
    console.error('GET /admin/campaigns error:', err);
    res.status(500).json({ message: 'Gagal mengambil kampanye' });
  }
});

// PATCH /admin/campaigns/:id/approve → PUBLISHED
router.patch('/campaigns/:id/approve', auth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);

  try {
    const campaign = await prisma.campaign.update({
      where: { id },
      data: { status: 'PUBLISHED' },
    });

    res.json({
      message: 'Kampanye disetujui',
      campaign,
    });
  } catch (err) {
    console.error('approve campaign error:', err);
    res.status(500).json({ message: 'Gagal menyetujui kampanye' });
  }
});

// PATCH /admin/campaigns/:id/reject → REJECTED
router.patch('/campaigns/:id/reject', auth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { reason } = req.body || {};

  try {
    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        status: 'REJECTED',
        // kalau di schema ada kolom rejectReason, bisa isi:
        // rejectReason: reason || null,
      },
    });

    res.json({
      message: 'Kampanye ditolak',
      campaign,
    });
  } catch (err) {
    console.error('reject campaign error:', err);
    res.status(500).json({ message: 'Gagal menolak kampanye' });
  }
});

module.exports = router;
