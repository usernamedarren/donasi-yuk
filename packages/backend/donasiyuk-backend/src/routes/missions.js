const express = require('express');
const prisma = require('../config/prisma');
const { auth } = require('../middleware/auth');
const { addPoints } = require('../services/pointsService');

const router = express.Router();

// GET /missions - list misi aktif
router.get('/', auth, async (req, res) => {
  try {
    const missions = await prisma.mission.findMany({
      where: { isActive: true },
    });
    res.json(missions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /missions/:code/complete
router.post('/:code/complete', auth, async (req, res) => {
  const { code } = req.params;

  try {
    const mission = await prisma.mission.findUnique({
      where: { code },
    });

    if (!mission || !mission.isActive) {
      return res.status(404).json({ message: 'Misi tidak ditemukan / tidak aktif' });
    }

    // cek maxPerDay kalau ada
    if (mission.maxPerDay) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const countToday = await prisma.userMissionLog.count({
        where: {
          userId: req.user.id,
          missionId: mission.id,
          createdAt: { gte: today },
        },
      });

      if (countToday >= mission.maxPerDay) {
        return res.status(400).json({ message: 'Misi hari ini sudah mencapai batas' });
      }
    }

    // catat log
    await prisma.userMissionLog.create({
      data: {
        userId: req.user.id,
        missionId: mission.id,
      },
    });

    // kasih poin
    await addPoints(req.user.id, mission.points, `Misi: ${mission.name}`);

    res.json({ message: 'Misi selesai, poin ditambahkan', points: mission.points });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
