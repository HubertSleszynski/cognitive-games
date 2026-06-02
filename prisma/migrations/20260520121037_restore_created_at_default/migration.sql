-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GameAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "game" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "startedAt" DATETIME NOT NULL,
    "endedAt" DATETIME NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "accuracy" REAL,
    "moves" INTEGER,
    "errors" INTEGER,
    "hintsUsed" INTEGER,
    "details" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GameAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_GameAttempt" ("accuracy", "createdAt", "details", "difficulty", "durationMs", "endedAt", "errors", "game", "hintsUsed", "id", "moves", "startedAt", "userId") SELECT "accuracy", "createdAt", "details", "difficulty", "durationMs", "endedAt", "errors", "game", "hintsUsed", "id", "moves", "startedAt", "userId" FROM "GameAttempt";
DROP TABLE "GameAttempt";
ALTER TABLE "new_GameAttempt" RENAME TO "GameAttempt";
CREATE INDEX "GameAttempt_userId_game_createdAt_idx" ON "GameAttempt"("userId", "game", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
