const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const prisma = new PrismaClient();

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPassword() {
  return crypto.randomBytes(12).toString("base64");
}

function randomDateByProgress(start, end, progress) {
  const startMs = start.getTime();
  const endMs = end.getTime();

  const noise = rand(-4, 4) * 24 * 60 * 60 * 1000;
  const date = new Date(startMs + (endMs - startMs) * progress + noise);

  date.setHours(rand(8, 23));
  date.setMinutes(rand(0, 59));
  date.setSeconds(rand(0, 59));
  date.setMilliseconds(0);

  return date;
}

const participants = [
  ["anna", "ania91x@gmail.com", 33, "FEMALE", "MASTER", "specjalistka HR", "MEDIUM", "HIGH", 1.02],
  ["Mateusz", "mateo84@wp.pl", 40, "MALE", "BACHELOR", "programista", "HIGH", "HIGH", 1.24],
  ["Karolina", "karola97@onet.pl", 27, "FEMALE", "MASTER", "psycholog", "MEDIUM", "HIGH", 1.05],
  ["Piotr", "piotrek_03@gmail.com", 21, "MALE", "BACHELOR", "student informatyki", "HIGH", "HIGH", 1.18],
  ["magda", "magda.hr88@onet.pl", 36, "FEMALE", "MASTER", "nauczycielka", "LOW", "MEDIUM", 0.87],
  ["Tomek", "tomek_76@wp.pl", 49, "MALE", "SECONDARY", "pracownik biurowy", "LOW", "MEDIUM", 0.82],
  ["Natalia", "natka22@gmail.com", 24, "FEMALE", "BACHELOR", "studentka", "MEDIUM", "HIGH", 1.03],
  ["Jakub", "jakub95@wp.pl", 29, "MALE", "BACHELOR", "technik informatyk", "HIGH", "HIGH", 1.19],
  ["ewa", "ewa54@interia.pl", 54, "FEMALE", "MASTER", "księgowa", "LOW", "MEDIUM", 0.76],
  ["Marcin", "marcin90@gmail.com", 35, "MALE", "MASTER", "manager projektu", "MEDIUM", "HIGH", 1.0],
  ["Ola", "ola_lisowna@onet.pl", 26, "FEMALE", "BACHELOR", "administracja", "LOW", "MEDIUM", 0.9],
  ["Kamil", "kamil.it42@gmail.com", 42, "MALE", "MASTER", "analityk danych", "MEDIUM", "HIGH", 1.1],
  ["Monika", "monia93@o2.pl", 31, "FEMALE", "MASTER", "pracownik biurowy", "MEDIUM", "HIGH", 0.98],
  ["adam", "adam99@onet.pl", 25, "MALE", "BACHELOR", "student", "HIGH", "HIGH", 1.13],
  ["Kasia", "kasia.foto38@gmail.com", 38, "FEMALE", "MASTER", "nauczycielka", "LOW", "MEDIUM", 0.86],
  ["Łukasz", "lukasz1977@wp.pl", 47, "MALE", "SECONDARY", "technik", "MEDIUM", "MEDIUM", 0.93],
  ["marta", "marta_01@gmail.com", 23, "FEMALE", "BACHELOR", "studentka", "MEDIUM", "HIGH", 1.04],
  ["Dawid", "dawid.dev@wp.pl", 30, "MALE", "BACHELOR", "programista", "HIGH", "HIGH", 1.26],
  ["Paulina", "paula89@interia.pl", 35, "FEMALE", "MASTER", "specjalistka ds. marketingu", "LOW", "HIGH", 0.91],
  ["Grzegorz", "greg81@gmail.com", 43, "MALE", "MASTER", "kierownik działu", "MEDIUM", "HIGH", 0.97],
  ["Julia", "julka04@o2.pl", 20, "FEMALE", "SECONDARY", "studentka", "HIGH", "HIGH", 1.12],
  ["Michał", "michal96@wp.pl", 28, "MALE", "BACHELOR", "informatyk", "HIGH", "HIGH", 1.22],
  ["patrycja", "pati92@gmail.com", 32, "FEMALE", "MASTER", "pedagog", "LOW", "MEDIUM", 0.88],
  ["Paweł", "pawel85@onet.pl", 39, "MALE", "MASTER", "pracownik administracyjny", "LOW", "HIGH", 0.89],
  ["Alicja", "ala.design@wp.pl", 27, "FEMALE", "BACHELOR", "grafik", "MEDIUM", "HIGH", 1.01],
  ["Robert", "robert73@gmail.com", 51, "MALE", "SECONDARY", "pracownik techniczny", "LOW", "MEDIUM", 0.79],
  ["asia", "asia87@o2.pl", 37, "FEMALE", "MASTER", "księgowa", "LOW", "HIGH", 0.86],
  ["Sebastian", "seba00@wp.pl", 24, "MALE", "BACHELOR", "student informatyki", "HIGH", "HIGH", 1.17],
  ["Dominika", "domi95@gmail.com", 29, "FEMALE", "MASTER", "rekruterka", "MEDIUM", "HIGH", 0.99],
  ["Rafał", "rafal35@onet.pl", 35, "MALE", "BACHELOR", "handlowiec", "MEDIUM", "HIGH", 0.96],
  ["beata", "beata78@wp.pl", 46, "FEMALE", "MASTER", "nauczycielka", "LOW", "MEDIUM", 0.8],
  ["Oskar", "oskar.dev02@gmail.com", 22, "MALE", "SECONDARY", "student", "HIGH", "HIGH", 1.14],
  ["anna", "anka83@interia.pl", 41, "FEMALE", "MASTER", "urzędniczka", "LOW", "MEDIUM", 0.84],
  ["Mateusz", "mati91@wp.pl", 33, "MALE", "MASTER", "analityk biznesowy", "MEDIUM", "HIGH", 1.06],
].map(([name, email, age, gender, education, occupation, gamingExperience, computerUsage, skill]) => ({
  name,
  email,
  age,
  gender,
  education,
  occupation,
  gamingExperience,
  computerUsage,
  skill,
}));

function getPreferredGames(profile) {
  if (profile.gamingExperience === "HIGH") {
    return pick([
      ["SEQUENCE_MEMORY", "SLIDER"],
      ["HANOI", "SLIDER"],
      ["MEMORY", "SEQUENCE_MEMORY"],
      ["SLIDER", "MEMORY"],
    ]);
  }

  if (profile.gamingExperience === "LOW") {
    return pick([
      ["MEMORY", "SUDOKU"],
      ["MEMORY", "SEQUENCE_MEMORY"],
      ["SUDOKU", "HANOI"],
      ["MEMORY", "SLIDER"],
    ]);
  }

  return pick([
    ["MEMORY", "SUDOKU"],
    ["SEQUENCE_MEMORY", "SLIDER"],
    ["MEMORY", "HANOI"],
    ["SUDOKU", "SEQUENCE_MEMORY"],
  ]);
}

function buildGamePlan(profile) {
  const games = ["MEMORY", "SEQUENCE_MEMORY", "SUDOKU", "SLIDER", "HANOI"];
  const [favorite, secondFavorite] = getPreferredGames(profile);

  const plan = {};

  for (const game of games) {
    plan[game] = rand(2, 5);
  }

  const mode = pick(["focused", "focused", "mixed", "mixed", "explorer"]);

  if (mode === "focused") {
    plan[favorite] += rand(18, 30);
    plan[secondFavorite] += rand(9, 18);

    const otherGames = games.filter((g) => g !== favorite && g !== secondFavorite);
    for (const game of otherGames) {
      plan[game] += rand(1, 5);
    }
  }

  if (mode === "mixed") {
    plan[favorite] += rand(12, 22);
    plan[secondFavorite] += rand(8, 16);

    const otherGames = games.filter((g) => g !== favorite && g !== secondFavorite);
    for (const game of otherGames) {
      plan[game] += rand(4, 9);
    }
  }

  if (mode === "explorer") {
    for (const game of games) {
      plan[game] += rand(7, 13);
    }
  }

  return {
    mode,
    favorite,
    secondFavorite,
    plan,
  };
}

function difficultyFor(game, profile, progress) {
  const highSkill = profile.skill > 1.1 || profile.gamingExperience === "HIGH";

  if (game === "MEMORY" || game === "SEQUENCE_MEMORY" || game === "SUDOKU") {
    if (progress < 0.25) return pick([1, 1, 1, 2]);
    if (progress < 0.65) return highSkill ? pick([1, 2, 2, 3]) : pick([1, 1, 2, 2]);
    return highSkill ? pick([2, 2, 3, 3]) : pick([1, 2, 2, 3]);
  }

  if (game === "SLIDER") {
    if (progress < 0.25) return pick([3, 3, 4]);
    if (progress < 0.65) return highSkill ? pick([3, 4, 4, 5]) : pick([3, 3, 4, 4]);
    return highSkill ? pick([4, 4, 5, 5]) : pick([3, 4, 4, 5]);
  }

  if (game === "HANOI") {
    if (progress < 0.25) return pick([3, 3, 4]);
    if (progress < 0.65) return highSkill ? pick([3, 4, 4, 5]) : pick([3, 3, 4, 4]);
    return highSkill ? pick([4, 5, 5, 6, 7]) : pick([3, 4, 4, 5]);
  }

  return 1;
}

function makeAttempt(userId, profile, game, indexInGame, totalInGame, participantStart, studyEnd) {
  const progress = indexInGame / Math.max(1, totalInGame - 1);

  const learningBoost = progress * 0.35;
  const fatigueOrNoise = rand(-3, 3) / 100;
  const skill = profile.skill + learningBoost + fatigueOrNoise;

  const difficulty = difficultyFor(game, profile, progress);

  const endedAt = randomDateByProgress(participantStart, studyEnd, progress);

  let durationMs = 60000;
  let moves = null;
  let errors = null;
  let hintsUsed = null;
  let details = {};

  if (game === "MEMORY") {
    const pairs = difficulty === 1 ? 8 : difficulty === 2 ? 18 : 32;
    const base = difficulty === 1 ? 60000 : difficulty === 2 ? 175000 : 400000;

    durationMs = Math.max(
      16000,
      Math.round(base / skill - progress * base * 0.35 + rand(-10000, 22000))
    );

    moves = pairs;

    errors = Math.max(
      0,
      Math.round((rand(2, pairs + 5) / skill) * (1 - progress * 0.55))
    );

    details = {
      board: difficulty === 1 ? "4x4" : difficulty === 2 ? "6x6" : "8x8",
      pairs,
      correctPairs: pairs,
      attemptInGame: indexInGame + 1,
    };
  }

  if (game === "SEQUENCE_MEMORY") {
    const baseLevel =
      difficulty === 1 ? rand(5, 11) : difficulty === 2 ? rand(4, 10) : rand(3, 8);

    const bestLevel = Math.max(
      2,
      Math.round(baseLevel * skill + progress * rand(5, 9))
    );

    durationMs = Math.max(
      18000,
      Math.round((bestLevel * 10000) / skill + rand(-4000, 9000))
    );

    moves = bestLevel;
    errors = 1;

    details = {
      bestLevel,
      correctSequences: bestLevel,
      grid: difficulty === 1 ? "2x2" : difficulty === 2 ? "3x3" : "4x4",
      attemptInGame: indexInGame + 1,
    };
  }

  if (game === "SUDOKU") {
    const base = difficulty === 1 ? 700000 : difficulty === 2 ? 1400000 : 2300000;

    durationMs = Math.max(
      260000,
      Math.round(base / skill - progress * base * 0.32 + rand(-120000, 180000))
    );

    errors = Math.max(
      0,
      Math.round(
        (rand(1, difficulty === 1 ? 7 : difficulty === 2 ? 12 : 18) / skill) *
          (1 - progress * 0.5)
      )
    );

    hintsUsed = Math.max(0, rand(0, difficulty + 1) - Math.round(progress * 2));

    details = {
      filled: 81,
      total: 81,
      difficultyLabel: difficulty === 1 ? "Łatwe" : difficulty === 2 ? "Średnie" : "Trudne",
      attemptInGame: indexInGame + 1,
    };
  }

  if (game === "SLIDER") {
    const size = difficulty;
    const base = size === 3 ? 50000 : size === 4 ? 175000 : 380000;
    const moveRange = size === 3 ? [28, 90] : size === 4 ? [95, 240] : [240, 470];

    durationMs = Math.max(
      18000,
      Math.round(base / skill - progress * base * 0.38 + rand(-12000, 28000))
    );

    moves = Math.max(
      10,
      Math.round((rand(moveRange[0], moveRange[1]) / skill) * (1 - progress * 0.35))
    );

    details = {
      size,
      attemptInGame: indexInGame + 1,
    };
  }

  if (game === "HANOI") {
    const disks = difficulty;
    const optimalMoves = Math.pow(2, disks) - 1;

    durationMs = Math.max(
      16000,
      Math.round((disks * 36000) / skill - progress * disks * 9000 + rand(-6000, 16000))
    );

    moves = Math.max(
      optimalMoves,
      Math.round(optimalMoves + (rand(4, 42) / skill) * (1 - progress * 0.5))
    );

    details = {
      disks,
      optimalMoves,
      ratio: Number((moves / optimalMoves).toFixed(2)),
      attemptInGame: indexInGame + 1,
    };
  }

  const startedAt = new Date(endedAt.getTime() - durationMs);

  return {
    userId,
    game,
    difficulty,
    startedAt,
    endedAt,
    durationMs,
    moves,
    errors,
    hintsUsed,
    accuracy: null,
    details,
  };
}

async function main() {
  const seedEmails = participants.map((p) => p.email);

  const previousSeedUsers = await prisma.user.findMany({
    where: {
      email: {
        in: seedEmails,
      },
    },
    select: {
      id: true,
    },
  });

  await prisma.gameAttempt.deleteMany({
    where: {
      userId: {
        in: previousSeedUsers.map((u) => u.id),
      },
    },
  });

  await prisma.user.deleteMany({
    where: {
      id: {
        in: previousSeedUsers.map((u) => u.id),
      },
    },
  });

  const games = ["MEMORY", "SEQUENCE_MEMORY", "SUDOKU", "SLIDER", "HANOI"];
  let totalAttempts = 0;

  const studyStart = new Date("2025-10-01T08:00:00");
  const studyEnd = new Date("2026-04-30T23:00:00");

  for (const p of participants) {
    const password = randomPassword();
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: p.email,
        name: p.name,
        password: hashedPassword,
        role: "USER",
        age: p.age,
        gender: p.gender,
        education: p.education,
        occupation: p.occupation,
        gamingExperience: p.gamingExperience,
        computerUsage: p.computerUsage,
      },
    });

    const participantStart = new Date(studyStart);
    participantStart.setDate(participantStart.getDate() + rand(0, 75));

    const { mode, favorite, secondFavorite, plan } = buildGamePlan(p);

    const attempts = [];

    for (const game of games) {
      const count = plan[game];

      for (let i = 0; i < count; i++) {
        attempts.push(
          makeAttempt(user.id, p, game, i, count, participantStart, studyEnd)
        );
      }
    }

    attempts.sort((a, b) => a.endedAt.getTime() - b.endedAt.getTime());

    await prisma.gameAttempt.createMany({
      data: attempts,
    });

    totalAttempts += attempts.length;

    console.log(
      `Dodano ${p.name}, prób: ${attempts.length}, tryb: ${mode}, ulubione: ${favorite}, ${secondFavorite}`,
      plan
    );
  }

  console.log("");
  console.log("Seed zakończony.");
  console.log(`Użytkownicy: ${participants.length}`);
  console.log(`Wyniki gier: ${totalAttempts}`);
  console.log("Hasła zostały wygenerowane losowo i nie są potrzebne do logowania.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });