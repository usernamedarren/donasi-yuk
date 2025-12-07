const prisma = require('../config/prisma');

async function ensureBadgesSeeded() {
  const count = await prisma.badge.count();
  if (count === 0) {
    await prisma.badge.createMany({
      data: [
        { name: 'Bronze Donor', description: 'Total donasi >= 100.000', minTotalDonation: 100000 },
        { name: 'Silver Donor', description: 'Total donasi >= 500.000', minTotalDonation: 500000 },
        { name: 'Gold Donor', description: 'Total donasi >= 1.000.000', minTotalDonation: 1000000 },
      ],
    });
  }
}

async function checkAndAssignBadges(userId) {
  await ensureBadgesSeeded();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const badges = await prisma.badge.findMany();

  for (const badge of badges) {
    if (user.totalDonations >= badge.minTotalDonation) {
      const existing = await prisma.userBadge.findUnique({
        where: {
          userId_badgeId: { userId, badgeId: badge.id },
        },
      });

      if (!existing) {
        await prisma.userBadge.create({
          data: { userId, badgeId: badge.id },
        });
      }
    }
  }
}

module.exports = { checkAndAssignBadges };
