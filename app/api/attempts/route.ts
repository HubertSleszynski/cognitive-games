import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

const schema = z.object({
  game: z.enum(["MEMORY", "SEQUENCE_MEMORY", "SUDOKU", "SLIDER", "HANOI"]),
  difficulty: z.number().int().min(1).max(10),

  startedAt: z.string().datetime(),
  endedAt: z.string().datetime(),
  durationMs: z.number().int().min(0),

  accuracy: z.number().min(0).max(1).optional(),
  moves: z.number().int().min(0).optional(),
  errors: z.number().int().min(0).optional(),
  hintsUsed: z.number().int().min(0).optional(),

  details: z.record(z.string(), z.any()).optional(),
});

export async function POST(req: Request) {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Niepoprawne dane", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const attempt = await prisma.gameAttempt.create({
    data: {
      userId,
      game: data.game,
      difficulty: data.difficulty,
      startedAt: new Date(data.startedAt),
      endedAt: new Date(data.endedAt),
      durationMs: data.durationMs,
      accuracy: data.accuracy,
      moves: data.moves,
      errors: data.errors,
      hintsUsed: data.hintsUsed,
      details: data.details ?? {},
    },
  });

  return NextResponse.json({ attempt });
}

export async function GET(req: Request) {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const game = searchParams.get("game");
  const take = Math.min(Number(searchParams.get("take") ?? "50"), 200);

  const where: any = { userId };
  if (game) where.game = game;

  const attempts = await prisma.gameAttempt.findMany({
    where,
    orderBy: { endedAt: "desc" },
    take,
  });

  return NextResponse.json({ attempts });
}