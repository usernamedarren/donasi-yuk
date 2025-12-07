const prisma = require('../config/prisma');

// Tambah poin ke user
async function addPoints(userId, amount, description) {
  if (amount <= 0) return;

  await prisma.$transaction(async (tx) => {
    await tx.pointTransaction.create({
      data: {
        userId,
        amount,
        type: 'EARN',
        description,
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        totalPoints: { increment: amount },
      },
    });
  });
}

// Kurangi poin (redeem reward)
async function spendPoints(userId, amount, description) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.totalPoints < amount) {
    throw new Error('Poin tidak cukup');
  }

  await prisma.$transaction(async (tx) => {
    await tx.pointTransaction.create({
      data: {
        userId,
        amount: -amount,
        type: 'REDEEM',
        description,
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        totalPoints: { decrement: amount },
      },
    });
  });
}

module.exports = { addPoints, spendPoints };
