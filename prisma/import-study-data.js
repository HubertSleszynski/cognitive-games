const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

const DATA_PATH = path.join(process.cwd(), "study-data.json");
const ADMIN_EMAIL = "h.r.sleszynski@gmail.com";

async function main() {
  const raw = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));

  const data = raw.filter((row) => row.email !== ADMIN_EMAIL);

  const emails = [...new Set(data.map((row) => row.email))];

  const existingUsers = await prisma.user.findMany({
    where: {
      email: {
        in: emails,
      },
    },
    select: {
      id: true,
    },
  });

  await prisma.gameAttempt.deleteMany({
    where: {
      userId: {
        in: existingUsers.map((u) => u.id),
      },
    },
  });

  await prisma.user.deleteMany({
    where: {
      email: {
        in: emails,
      },
    },
  });

  const hashedPassword = await bcrypt.hash("RandomPasswordNotUsed123!", 10);

  const userByEmail = new Map();

  for (const email of emails) {
    const first = data.find((row) => row.email === email);

    const user = await prisma.user.create({
      data: {
        email: first.email,
        name: first.userName,
        password: hashedPassword,
        role: "USER",
        age: first.age,
        gender: first.gender,
        education: first.education,
        occupation: first.occupation,
        gamingExperience: first.gamingExperience,
        computerUsage: first.computerUsage,
      },
    });

    userByEmail.set(email, user);
  }

  const attempts = data.map((row) => {
    const user = userByEmail.get(row.email);

    return {
      userId: user.id,
      game: row.game,
      difficulty: row.difficulty,
      startedAt: new Date(row.startedAt),
      endedAt: new Date(row.endedAt),
      durationMs: row.durationMs,
      accuracy: row.accuracy ?? null,
      moves: row.moves ?? null,
      errors: row.errors ?? null,
      hintsUsed: row.hintsUsed ?? null,
      details: row.details ?? undefined,
      createdAt: new Date(row.endedAt),
    };
  });

  await prisma.gameAttempt.createMany({
    data: attempts,
  });

  console.log(`Zaimportowano użytkowników: ${emails.length}`);
  console.log(`Zaimportowano wyników gier: ${attempts.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });