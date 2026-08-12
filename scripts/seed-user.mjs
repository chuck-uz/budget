// Идемпотентно создаёт/обновляет единственного пользователя из ADMIN_EMAIL/ADMIN_PASSWORD.
// Запускается в docker-entrypoint после миграций. Ротация пароля-секрета → ротация входа.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || "";

if (!email || !password) {
  console.log("[seed] ADMIN_EMAIL/ADMIN_PASSWORD не заданы — пропуск");
  process.exit(0);
}

const prisma = new PrismaClient();
try {
  const hash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    create: { email, password: hash },
    update: { password: hash },
  });
  console.log("[seed] пользователь готов:", email);
} finally {
  await prisma.$disconnect();
}
