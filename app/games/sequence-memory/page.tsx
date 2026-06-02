"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FinishModal } from "@/components/FinishModal";

type Difficulty = 1 | 2 | 3;
type Phase = "idle" | "ready" | "showing" | "input" | "gameover";

function wait(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

function randInt(maxExclusive: number) {
  return Math.floor(Math.random() * maxExclusive);
}
function fmtTime(ms: number) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function SequenceMemoryPage() {
  const [difficulty, setDifficulty] = useState<Difficulty>(3);

  const gridSize = difficulty === 1 ? 2 : difficulty === 2 ? 3 : 4;
  const padCount = gridSize * gridSize;

  const showMs = difficulty === 1 ? 520 : difficulty === 2 ? 440 : 360;
  const gapMs = difficulty === 1 ? 500 : difficulty === 2 ? 400 : 300;

  const [phase, setPhase] = useState<Phase>("idle");
  const [sequence, setSequence] = useState<number[]>([]);
  const [userIndex, setUserIndex] = useState(0);

  const [flashId, setFlashId] = useState<number | null>(null);

  const [userFlashId, setUserFlashId] = useState<number | null>(null);

  const [level, setLevel] = useState(0);
  const [bestLevelRun, setBestLevelRun] = useState(0); 
  const [bestAllTime, setBestAllTime] = useState<number>(0); 

  const [moves, setMoves] = useState(0);
  const [errors, setErrors] = useState(0);

  const startedAtRef = useRef<Date | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const [savingMsg, setSavingMsg] = useState("");

  const difficultyLabel =
    difficulty === 1
      ? "Łatwy 2×2"
      : difficulty === 2
      ? "Średni 3×3"
      : "Trudny 4×4";


  useEffect(() => {
    const id = window.setInterval(() => {
      if (!startedAtRef.current) return;
      if (phase === "idle") return;
      if (phase === "ready") return;
      if (phase === "gameover") return;
      setElapsedMs(Date.now() - startedAtRef.current.getTime());
    }, 250);

    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    let cancelled = false;

    async function loadBest() {
      const res = await fetch(`/api/attempts?game=SEQUENCE_MEMORY&take=300`);
      const data = await res.json().catch(() => null);
      if (cancelled) return;

      if (!res.ok || !data?.attempts) {
        setBestAllTime(0);
        return;
      }

      const attempts: any[] = data.attempts;
      const filtered = attempts.filter(
        a => Number(a.difficulty) === Number(difficulty)
      );

      let best = 0;
      for (const a of filtered) {
        const v = a?.details?.bestLevel;
        if (typeof v === "number" && v > best) best = v;
      }

      setBestAllTime(best);
    }

    loadBest();
    return () => {
      cancelled = true;
    };
  }, [difficulty]);

  async function flashOnce(id: number) {
    setFlashId(id);
    await wait(showMs);
    setFlashId(null);
    await wait(gapMs);
  }

  async function showSequence(seq: number[]) {
    setPhase("showing");
    setUserIndex(0);

    for (const id of seq) {
      await flashOnce(id);
    }
    setPhase("input");
  }

  function prepareGame(nextDiff: Difficulty) {
    setDifficulty(nextDiff);

    setSavingMsg("");
    setErrors(0);
    setMoves(0);
    setLevel(0);
    setBestLevelRun(0);
    setUserIndex(0);
    setSequence([]);
    setElapsedMs(0);

    startedAtRef.current = null;
    setPhase("ready");
  }

  async function startGame(diff: Difficulty) {
    const nextDiff = diff;
    setDifficulty(nextDiff);

    setSavingMsg("");
    setErrors(0);
    setMoves(0);
    setLevel(0);
    setBestLevelRun(0);
    setUserIndex(0);
    setSequence([]);
    setElapsedMs(0);

    startedAtRef.current = new Date();

    await wait(120);

    const first = randInt(nextDiff === 1 ? 4 : nextDiff === 2 ? 9 : 16);
    const seq = [first];

    setSequence(seq);
    setLevel(1);
    setBestLevelRun(1);

    await showSequence(seq);
  }

  async function nextLevel() {
    const next = [...sequence, randInt(padCount)];
    setSequence(next);
    setLevel(next.length);
    setBestLevelRun(b => Math.max(b, next.length));
    await wait(150);
    await showSequence(next);
  }

  async function endGame() {
    setPhase("gameover");
    const end = new Date();
    await saveAttempt(end);
  }

  async function saveAttempt(end: Date) {
    if (!startedAtRef.current) return;

    const startedAt = startedAtRef.current;
    const durationMs = end.getTime() - startedAt.getTime();

    setSavingMsg("Zapisuję wynik...");

    const payload = {
      game: "SEQUENCE_MEMORY",
      difficulty,
      startedAt: startedAt.toISOString(),
      endedAt: end.toISOString(),
      durationMs,
      moves,
      errors,
      details: {
        bestLevel: bestLevelRun,
        grid: `${gridSize}x${gridSize}`,
        padCount,
        showMs,
        gapMs,
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
    setBestAllTime(prev => Math.max(prev, bestLevelRun));
  }

  async function onPadClick(id: number) {
    if (phase !== "input") return;

    setUserFlashId(id);
    await wait(140);
    setUserFlashId(null);

    setMoves(m => m + 1);

    const expected = sequence[userIndex];

    if (id !== expected) {
      setErrors(e => e + 1);
      await endGame();
      return;
    }

    const nextIndex = userIndex + 1;
    setUserIndex(nextIndex);

    if (nextIndex >= sequence.length) {
      setPhase("showing");
      await nextLevel();
    }
  }

  const canClick = phase === "input";
  const totalPads = padCount;

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Sequence Memory</h1>
          <p className="text-sm text-gray-600">
            Zapamiętaj sekwencję i odtwórz ją. Zapisywane metryki: czas i liczba poprawnie powtórzonych sekwencji.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            className="border rounded px-3 py-2 hover:bg-gray-50"
            onClick={() => prepareGame(difficulty)}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-gray-700">
        <div className="border rounded px-3 py-2">
          Trudność: <b>{difficultyLabel}</b>
        </div>
        <div className="border rounded px-3 py-2">
          Poziom: <b>{level}</b>
        </div>
        <div className="border rounded px-3 py-2">
          Best (rozgrywka): <b>{bestLevelRun}</b>
        </div>
        <div className="border rounded px-3 py-2">
          Best (wszechczasów): <b>{bestAllTime}</b>
        </div>
        <div className="border rounded px-3 py-2">
          Czas:{" "}
          <b>
            {phase === "idle" || phase === "ready"
              ? "00:00"
              : fmtTime(elapsedMs)}
          </b>
        </div>
        <div className="border rounded px-3 py-2">
          Faza: <b>{phase}</b>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-gray-700">Tryb:</span>
        <button
          className={`border rounded px-3 py-2 hover:bg-gray-50 ${
            difficulty === 1 ? "font-semibold" : ""
          }`}
          onClick={() => prepareGame(1)}
        >
          Łatwy 2×2
        </button>
        <button
          className={`border rounded px-3 py-2 hover:bg-gray-50 ${
            difficulty === 2 ? "font-semibold" : ""
          }`}
          onClick={() => prepareGame(2)}
        >
          Średni 3×3
        </button>
        <button
          className={`border rounded px-3 py-2 hover:bg-gray-50 ${
            difficulty === 3 ? "font-semibold" : ""
          }`}
          onClick={() => prepareGame(3)}
        >
          Trudny 4×4
        </button>

        <span className="text-xs text-gray-500 ml-2">
          Tempo: pokaz {showMs}ms, przerwa {gapMs}ms
        </span>
      </div>

      {/* plansza: większy gap + ograniczona szerokość */}
      <div
        className="grid gap-5 w-full max-w-2xl mx-auto"
        style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: totalPads }, (_, i) => {
          const activeGame = flashId === i;
          const activeUser = userFlashId === i;

          return (
            <button
              key={i}
              onClick={() => onPadClick(i)}
              disabled={!canClick}
              className={[
                "aspect-square rounded-xl border-2 flex items-center justify-center select-none transition",
                "text-4xl font-semibold shadow-sm",
                canClick ? "cursor-pointer" : "cursor-not-allowed opacity-90",
                activeGame
                  ? "bg-blue-200 border-blue-400"
                  : activeUser
                  ? "bg-green-200 border-green-400"
                  : "bg-white hover:bg-gray-50 border-gray-200",
              ].join(" ")}
              aria-label={`Pad ${i + 1}`}
              title={`Pad ${i + 1}`}
            >
              {/* tylko dla 2x2 i 3x3 pomagamy numerkami */}
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* START overlay */}
      {phase === "ready" && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-lg space-y-3">
            <h3 className="text-xl font-semibold">Gotowe?</h3>
            <p className="text-sm text-gray-600">
              Tryb: <b>{difficultyLabel}</b>. Naciśnij Start — gra pokaże
              sekwencję.
            </p>
            <p className="text-xs text-gray-500">
              Tempo: pokaz {showMs}ms, przerwa {gapMs}ms
            </p>

            <div className="flex gap-2 pt-2">
              <button
                className="border rounded-lg px-4 py-2 hover:bg-gray-50 font-semibold"
                onClick={() => startGame(difficulty)}
              >
                Start
              </button>
              <button
                className="border rounded-lg px-4 py-2 hover:bg-gray-50"
                onClick={() => setPhase("idle")}
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      <FinishModal
        open={phase === "gameover"}
        title="Koniec gry"
        subtitle="Wynik został zapisany. Możesz zagrać ponownie albo zobaczyć historię."
        savingMsg={savingMsg}
        onPlayAgain={() => prepareGame(difficulty)}
      />
    </main>
  );
}
