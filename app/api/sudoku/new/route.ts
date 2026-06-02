import { NextResponse } from "next/server";
import { z } from "zod";
import { generateSudoku } from "@/lib/games/sudoku";
import { getSessionUserId } from "@/lib/session";

const querySchema = z.object({
  difficulty: z
    .string()
    .optional()
    .transform((v) => {
      if (v === "1" || v === "2" || v === "3") return Number(v) as 1 | 2 | 3;
      return 1;
    }),
});

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({
    difficulty: searchParams.get("difficulty"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Niepoprawne parametry" }, { status: 400 });
  }

  const difficulty = parsed.data.difficulty;

  try {
    const { puzzle, solution } = generateSudoku(difficulty);

    return NextResponse.json({
      puzzle,
      solution,
      difficulty,
    });
  } catch (err) {
    console.error("Sudoku generation error:", err);
    return NextResponse.json(
      { error: "Nie udało się wygenerować Sudoku" },
      { status: 500 }
    );
  }
}
