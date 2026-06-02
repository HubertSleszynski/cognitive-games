"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Difficulty, isSolvedCorrectly, validateCell } from "@/lib/games/sudoku";
import { FinishModal } from "@/components/FinishModal";

type CellState = {
  value: number;
  given: boolean;
  error: boolean;
};
function fmtTime(ms: number) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function SudokuPage() {
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [puzzle, setPuzzle] = useState<number[]>([]);
  const [solution, setSolution] = useState<number[]>([]);
  const [cells, setCells] = useState<CellState[]>([]);
  const [selected, setSelected] = useState<number | null>(null);

  const [moves, setMoves] = useState(0);
  const [errors, setErrors] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);

  const [finished, setFinished] = useState(false);
  const [savingMsg, setSavingMsg] = useState("");

  const startedAtRef = useRef<Date | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const difficultyLabel = useMemo(() => {
    if (difficulty === 1) return "Łatwe";
    if (difficulty === 2) return "Średnie";
    return "Trudne";
  }, [difficulty]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!startedAtRef.current) return;
      if (finished) return;
      setElapsedMs(Date.now() - startedAtRef.current.getTime());
    }, 250);

    return () => window.clearInterval(id);
  }, [finished]);

  async function newGame(diff: Difficulty) {
    setSavingMsg("Generuję planszę...");
    setFinished(false);

    const res = await fetch(`/api/sudoku/new?difficulty=${diff}`);
    const data = await res.json().catch(() => null);

    if (!res.ok || !data) {
      setSavingMsg("❌ Błąd generowania Sudoku");
      return;
    }

    const { puzzle, solution } = data;

    setDifficulty(diff);
    setPuzzle(puzzle);
    setSolution(solution);

    setCells(
      (puzzle as number[]).map((v) => ({
        value: v,
        given: v !== 0,
        error: false,
      }))
    );

    setSelected(null);
    setMoves(0);
    setErrors(0);
    setHintsUsed(0);
    setFinished(false);
    setSavingMsg("");
    startedAtRef.current = null;
    setElapsedMs(0);
  }


  useEffect(() => {
    void newGame(1);
  }, []);

  function ensureStartTime() {
    if (!startedAtRef.current) {
      startedAtRef.current = new Date();
      setElapsedMs(0);
    }
  }

  function setValue(pos: number, val: number) {
    if (finished) return;
    if (!cells[pos]) return;

    const current = cells[pos];
    if (current.given) return;

    ensureStartTime();

    setCells((prev) => {
      const next = prev.slice();
      const cell = next[pos];


      if (val === 0) {
        next[pos] = { ...cell, value: 0, error: false };
        return next;
      }

      const board = next.map((c) => c.value);
      board[pos] = val;
      const okRules = validateCell(board, pos, val);

      const okSolution = solution[pos] === val;

      next[pos] = { ...cell, value: val, error: !(okRules && okSolution) };
      return next;
    });

    setMoves((m) => m + 1);

    if (solution[pos] !== val) {
      setErrors((e) => e + 1);
    }
  }

  useEffect(() => {
    if (cells.length !== 81) return;
    if (!solution.length) return;
    if (finished) return;

    const board = cells.map((c) => c.value);
    if (isSolvedCorrectly(board, solution)) {
      setFinished(true);
      const end = new Date();
      void saveAttempt(end, board);
    }
  }, [cells]);

  async function saveAttempt(end: Date, board: number[]) {
    const startedAt = startedAtRef.current ?? end;
    const durationMs = end.getTime() - startedAt.getTime();

    setSavingMsg("Zapisuję wynik...");

    const payload = {
      game: "SUDOKU",
      difficulty,
      startedAt: startedAt.toISOString(),
      endedAt: end.toISOString(),
      durationMs,
      moves,
      errors,
      hintsUsed,
      details: {
        filled: board.filter((v) => v !== 0).length,
        total: 81,
        difficultyLabel,
      },
    };

    const res = await fetch("/api/attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setSavingMsg(`Błąd zapisu: ${data?.error || "nieznany błąd"}`);
      return;
    }

    setSavingMsg("✅ Zapisano wynik! Sprawdź Historię.");
  }

  function giveHint() {
    if (finished) return;
    if (selected == null) return;
    if (!cells[selected] || cells[selected].given) return;

    ensureStartTime();

    setCells((prev) => {
      const next = prev.slice();
      next[selected] = { ...next[selected], value: solution[selected], error: false };
      return next;
    });

    setHintsUsed((h) => h + 1);
    setMoves((m) => m + 1);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (selected == null) return;
    if (finished) return;

    const k = e.key;
    if (k >= "1" && k <= "9") {
      setValue(selected, Number(k));
    } else if (k === "Backspace" || k === "Delete" || k === "0") {
      setValue(selected, 0);
    }
  }

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-4" tabIndex={0} onKeyDown={onKeyDown}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Sudoku</h1>
          <p className="text-sm text-gray-600">
            Błąd oznacza wpis niezgodny z rozwiązaniem. Zapisywane metryki: czas i liczba błędów.
          </p>
        </div>

        <div className="flex gap-2">
          <button className="border rounded px-3 py-2 hover:bg-gray-50" onClick={() => void newGame(difficulty)}>
            Reset
          </button>
          <button
            className="border rounded px-3 py-2 hover:bg-gray-50 font-semibold"
            onClick={giveHint}
            disabled={selected == null || finished}
          >
            Podpowiedź
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-gray-700">
        <div className="border rounded px-3 py-2">
          Tryb: <b>{difficultyLabel}</b>
        </div>
        <div className="border rounded px-3 py-2">
          Czas: <b>{startedAtRef.current ? fmtTime(elapsedMs) : "00:00"}</b>
        </div>
        <div className="border rounded px-3 py-2">
          Ruchy: <b>{moves}</b>
        </div>
        <div className="border rounded px-3 py-2">
          Błędy: <b>{errors}</b>
        </div>
        <div className="border rounded px-3 py-2">
          Podpowiedzi: <b>{hintsUsed}</b>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button className="border rounded px-3 py-2 hover:bg-gray-50" onClick={() => void newGame(1)}>
          Nowe (łatwe)
        </button>
        <button className="border rounded px-3 py-2 hover:bg-gray-50" onClick={() => void newGame(2)}>
          Nowe (średnie)
        </button>
        <button className="border rounded px-3 py-2 hover:bg-gray-50" onClick={() => void newGame(3)}>
          Nowe (trudne)
        </button>

        {savingMsg && <span className="text-gray-600 ml-2">{savingMsg}</span>}
      </div>

      {/* większa plansza */}
      <div className="grid grid-cols-9 gap-0 border w-fit mx-auto">
        {cells.map((cell, i) => {
          const r = Math.floor(i / 9);
          const c = i % 9;

          const isSel = selected === i;
          const thickTop = r % 3 === 0 ? "border-t-2" : "border-t";
          const thickLeft = c % 3 === 0 ? "border-l-2" : "border-l";
          const thickRight = c === 8 ? "border-r-2" : "border-r";
          const thickBottom = r === 8 ? "border-b-2" : "border-b";

          return (
            <button
              key={i}
              className={[
                "w-12 h-12 md:w-14 md:h-14 flex items-center justify-center text-xl md:text-2xl select-none",
                thickTop, thickLeft, thickRight, thickBottom,
                cell.given ? "bg-gray-50 font-semibold" : "bg-white",
                cell.error ? "text-red-600" : "text-gray-900",
                isSel ? "outline-2 outline-blue-400" : "",
              ].join(" ")}
              onClick={() => setSelected(i)}
            >
              {cell.value === 0 ? "" : cell.value}
            </button>
          );
        })}
      </div>

      <div className="text-sm text-gray-600 space-y-1">
        <p>• Kliknij pole i wpisuj z klawiatury 1–9. Backspace/Delete usuwa.</p>
        <p>• Czerwone cyfry oznaczają wpis niezgodny z rozwiązaniem.</p>
      </div>

      <FinishModal
        open={finished}
        title="🎉 Sudoku ukończone!"
        subtitle="Gratulacje — wynik zapisany w historii."
        savingMsg={savingMsg}
        onPlayAgain={() => void newGame(difficulty)}
      />
    </main>
  );
}
