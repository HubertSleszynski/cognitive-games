"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FinishModal } from "@/components/FinishModal";

type Size = 3 | 4 | 5;

function randInt(maxExclusive: number) {
  return Math.floor(Math.random() * maxExclusive);
}

function fmtTime(ms: number) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function indexToRC(i: number, size: number) {
  return { r: Math.floor(i / size), c: i % size };
}

function rcToIndex(r: number, c: number, size: number) {
  return r * size + c;
}

function neighborsOfEmpty(emptyIndex: number, size: number) {
  const { r, c } = indexToRC(emptyIndex, size);
  const n: number[] = [];

  if (r > 0) n.push(rcToIndex(r - 1, c, size));
  if (r < size - 1) n.push(rcToIndex(r + 1, c, size));
  if (c > 0) n.push(rcToIndex(r, c - 1, size));
  if (c < size - 1) n.push(rcToIndex(r, c + 1, size));

  return n;
}

function solvedBoard(size: number) {
  const total = size * size;
  return Array.from({ length: total }, (_, i) => (i + 1) % total);
}

function isSolved(board: number[], size: number) {
  const solved = solvedBoard(size);
  return board.length === solved.length && board.every((v, i) => v === solved[i]);
}

function scramble(size: number, steps: number) {
  let board = solvedBoard(size);
  let empty = board.indexOf(0);
  let prevEmpty = -1;

  for (let k = 0; k < steps; k++) {
    const neigh = neighborsOfEmpty(empty, size);
    const choices = neigh.filter((x) => x !== prevEmpty);
    const pick = choices.length
      ? choices[randInt(choices.length)]
      : neigh[randInt(neigh.length)];

    const next = board.slice();
    [next[pick], next[empty]] = [next[empty], next[pick]];

    prevEmpty = empty;
    empty = pick;
    board = next;
  }

  if (isSolved(board, size)) return scramble(size, steps + 10);
  return board;
}

export default function SliderPage() {
  const [size, setSize] = useState<Size>(4);
  const total = size * size;

  const [board, setBoard] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  const startedAtRef = useRef<Date | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const [finished, setFinished] = useState(false);
  const [savingMsg, setSavingMsg] = useState("");

  const emptyIndex = useMemo(() => board.indexOf(0), [board]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!startedAtRef.current) return;
      if (finished) return;
      setElapsedMs(Date.now() - startedAtRef.current.getTime());
    }, 250);
    return () => window.clearInterval(id);
  }, [finished]);

  function newGame(forceSize?: Size) {
    const nextSize = forceSize ?? size;

    setSavingMsg("");
    setFinished(false);
    setMoves(0);
    startedAtRef.current = null;
    setElapsedMs(0);

    if (forceSize) setSize(forceSize);

    const steps = nextSize === 3 ? 40 : nextSize === 4 ? 180 : 380;
    const next = scramble(nextSize, steps);
    setBoard(next);
  }

  useEffect(() => {
    newGame(4);
  }, []);

  function canMove(index: number) {
    if (finished) return false;
    if (index < 0) return false;
    if (board[index] === 0) return false;
    const neigh = neighborsOfEmpty(emptyIndex, size);
    return neigh.includes(index);
  }

  async function saveAttempt(end: Date) {
    if (!startedAtRef.current) return;
    const startedAt = startedAtRef.current;
    const durationMs = end.getTime() - startedAt.getTime();

    setSavingMsg("Zapisuję wynik...");

    const payload = {
      game: "SLIDER",
      difficulty: size,
      startedAt: startedAt.toISOString(),
      endedAt: end.toISOString(),
      durationMs,
      moves,
      details: { size },
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

  function moveTile(index: number) {
    if (!canMove(index)) return;

    if (!startedAtRef.current) {
      startedAtRef.current = new Date();
      setElapsedMs(0);
    }

    const next = board.slice();
    [next[index], next[emptyIndex]] = [next[emptyIndex], next[index]];
    setBoard(next);
    setMoves(m => m + 1);

    if (isSolved(next, size)) {
      setFinished(true);
      const end = new Date();
      void saveAttempt(end);
    }
  }

  const tileClass =
    size === 3
      ? "w-32 h-32 text-4xl"
      : size === 4
      ? "w-24 h-24 md:w-28 md:h-28 text-3xl md:text-4xl"
      : "w-20 h-20 md:w-24 md:h-24 text-2xl md:text-3xl";

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Puzzle Slider</h1>
          <p className="text-sm text-gray-600">
            Ułóż kafelki rosnąco, zostawiając puste pole na końcu. Zapisywane metryki: czas i ruchy.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            className="border rounded px-3 py-2 hover:bg-gray-50"
            onClick={() => newGame()}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-gray-700">
        <div className="border rounded px-3 py-2">
          Plansza:{" "}
          <b>
            {size}×{size}
          </b>
        </div>
        <div className="border rounded px-3 py-2">
          Czas: <b>{startedAtRef.current ? fmtTime(elapsedMs) : "00:00"}</b>
        </div>
        <div className="border rounded px-3 py-2">
          Ruchy: <b>{moves}</b>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button
          className="border rounded px-3 py-2 hover:bg-gray-50"
          onClick={() => newGame(3)}
        >
          Nowa 3×3
        </button>
        <button
          className="border rounded px-3 py-2 hover:bg-gray-50"
          onClick={() => newGame(4)}
        >
          Nowa 4×4
        </button>
        <button
          className="border rounded px-3 py-2 hover:bg-gray-50"
          onClick={() => newGame(5)}
        >
          Nowa 5×5
        </button>

        {savingMsg && <span className="text-gray-600 ml-2">{savingMsg}</span>}
      </div>

      {/* większa plansza, wycentrowana */}
      <div
        className="grid gap-3 w-fit mx-auto"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: total }, (_, i) => {
          const v = board[i];
          const empty = v === 0;
          const movable = canMove(i);

          return (
            <button
              key={i}
              onClick={() => moveTile(i)}
              className={[
                tileClass,
                "rounded-xl border-2 flex items-center justify-center select-none transition",
                empty
                  ? "bg-white border-dashed"
                  : movable
                  ? "bg-blue-50 border-blue-400 ring-2 ring-blue-300 hover:bg-blue-100"
                  : "bg-gray-50 border-gray-300",
                movable ? "cursor-pointer" : "cursor-default",
                finished ? "opacity-90" : "",
              ].join(" ")}
              aria-label={empty ? "Empty" : `Tile ${v}`}
            >
              {empty ? "" : v}
            </button>
          );
        })}
      </div>

      <FinishModal
        open={finished}
        title="🎉 Ukończone!"
        subtitle="Ułożyłeś puzzle. Wynik zapisany w historii."
        savingMsg={savingMsg}
        onPlayAgain={() => newGame()}
      />
    </main>
  );
}
