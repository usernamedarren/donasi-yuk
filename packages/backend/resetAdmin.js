import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function resetAdmin() {
  const newPassword = await bcrypt.hash("admin123", 10);

  await prisma.user.update({
    where: { email: "abcd@gmail.com" },
    data: { passwordHash: newPassword },
  });

  console.log("✅ Password admin berhasil di-reset ke: admin123");
  process.exit(0);
}

resetAdmin();
