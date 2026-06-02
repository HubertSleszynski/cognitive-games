"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FinishModal } from "@/components/FinishModal";

type Peg = 0 | 1 | 2;
type Disk = number;
function optimalMoves(disks: number) {
  return Math.pow(2, disks) - 1;
}

function fmtTime(ms: number) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function HanoiPage() {
  const [disks, setDisks] = useState(4);
  const [pegs, setPegs] = useState<Disk[][]>([]);
  const [selectedPeg, setSelectedPeg] = useState<Peg | null>(null);

  const [moves, setMoves] = useState(0);
  const [errors, setErrors] = useState(0);

  const startedAtRef = useRef<Date | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [finished, setFinished] = useState(false);
  const [savingMsg, setSavingMsg] = useState("");

  const opt = useMemo(() => optimalMoves(disks), [disks]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!startedAtRef.current || finished) return;
      setElapsedMs(Date.now() - startedAtRef.current.getTime());
    }, 250);

    return () => window.clearInterval(id);
  }, [finished]);

  function fmtTime(ms: number) {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function newGame(forceDisks?: number) {
    const d = forceDisks ?? disks;

    setSavingMsg("");
    setFinished(false);
    setMoves(0);
    setErrors(0);
    setSelectedPeg(null);
    startedAtRef.current = null;
    setElapsedMs(0);

    if (forceDisks) setDisks(forceDisks);

    const startPeg: Disk[] = [];
    for (let i = d; i >= 1; i--) startPeg.push(i);

    setPegs([startPeg, [], []]);
  }

  useEffect(() => {
    newGame(4);
  }, []);

  function topDisk(peg: Peg) {
    const stack = pegs[peg] ?? [];
    return stack[stack.length - 1] ?? null;
  }

  function canMove(from: Peg, to: Peg) {
    if (from === to) return false;
    const fromTop = topDisk(from);
    if (fromTop == null) return false;

    const toTop = topDisk(to);
    if (toTop == null) return true;

    return fromTop < toTop;
  }

  async function saveAttempt(end: Date) {
    if (!startedAtRef.current) return;
    const startedAt = startedAtRef.current;
    const durationMs = end.getTime() - startedAt.getTime();

    setSavingMsg("Zapisuję wynik...");

    const payload = {
      game: "HANOI",
      difficulty: disks,
      startedAt: startedAt.toISOString(),
      endedAt: end.toISOString(),
      durationMs,
      moves,
      errors,
      details: {
        disks,
        optimalMoves: opt,
        ratio: Number((moves / opt).toFixed(3)),
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

  function onPegClick(peg: Peg) {
    if (finished) return;

    if (!startedAtRef.current) {
      startedAtRef.current = new Date();
      setElapsedMs(0);
    }

    if (selectedPeg == null) {
      if (topDisk(peg) == null) return;
      setSelectedPeg(peg);
      return;
    }

    if (selectedPeg === peg) {
      setSelectedPeg(null);
      return;
    }

    const from = selectedPeg;
    const to = peg;

    if (!canMove(from, to)) {
      setErrors(e => e + 1);
      setSelectedPeg(null);
      return;
    }

    setPegs(prev => {
      const next = prev.map(s => s.slice()) as Disk[][];
      const disk = next[from].pop()!;
      next[to].push(disk);
      return next;
    });

    setMoves(m => m + 1);
    setSelectedPeg(null);

    setTimeout(async () => {
      const done = (pegs[2]?.length ?? 0) === disks;
      if (done) {
        setFinished(true);
        const end = new Date();
        await saveAttempt(end);
      }
    }, 0);
  }

  useEffect(() => {
    if (pegs.length === 0) return;
    if (finished) return;

    const done = (pegs[2]?.length ?? 0) === disks;
    if (done) {
      setFinished(true);
      const end = new Date();
      void saveAttempt(end);
    }
  }, [pegs]);

  const pegLabels = ["A", "B", "C"];

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Wieża Hanoi</h1>
          <p className="text-sm text-gray-600">
            Przenieś wszystkie krążki z A do C. Nie wolno kłaść większego na
            mniejszym.
          </p>
        </div>
        <button className="border rounded px-3 py-2 hover:bg-gray-50" onClick={() => newGame()}>
          Reset
        </button>
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-gray-700">
        <div className="border rounded px-3 py-2">
          Krążki: <b>{disks}</b>
        </div>
        <div className="border rounded px-3 py-2">
          Czas: <b>{startedAtRef.current ? fmtTime(elapsedMs) : "00:00"}</b>
        </div>
        <div className="border rounded px-3 py-2">
          Ruchy: <b>{moves}</b>
        </div>
        <div className="border rounded px-3 py-2">
          Optimum: <b>{opt}</b>
        </div>
        <div className="border rounded px-3 py-2">
          Wybrane: <b>{selectedPeg == null ? "-" : pegLabels[selectedPeg]}</b>
        </div>
        <div className="border rounded px-3 py-2">
          Status: <b>{finished ? "ukończone" : "w trakcie"}</b>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button
          className="border rounded px-3 py-2 hover:bg-gray-50"
          onClick={() => newGame(3)}
        >
          Nowa (3)
        </button>
        <button
          className="border rounded px-3 py-2 hover:bg-gray-50"
          onClick={() => newGame(4)}
        >
          Nowa (4)
        </button>
        <button
          className="border rounded px-3 py-2 hover:bg-gray-50"
          onClick={() => newGame(5)}
        >
          Nowa (5)
        </button>
        <button
          className="border rounded px-3 py-2 hover:bg-gray-50"
          onClick={() => newGame(6)}
        >
          Nowa (6)
        </button>
        <button
          className="border rounded px-3 py-2 hover:bg-gray-50"
          onClick={() => newGame(7)}
        >
          Nowa (7)
        </button>

        <button
          className="border rounded px-3 py-2 hover:bg-gray-50"
          onClick={() => newGame()}
        >
          Reset
        </button>

        {savingMsg && <span className="text-gray-600 ml-2">{savingMsg}</span>}
      </div>

      <div className="grid grid-cols-3 gap-6 max-w-3xl">
        {[0, 1, 2].map(p => {
          const peg = p as Peg;
          const stack = pegs[peg] ?? [];
          const top = topDisk(peg);
          const isSelected = selectedPeg === peg;

          return (
            <button
              key={peg}
              onClick={() => onPegClick(peg)}
              className={[
                "border rounded p-4 min-h-80 flex flex-col items-center justify-end gap-2",
                "hover:bg-gray-50",
                isSelected ? "outline-2 outline-blue-400" : "",
              ].join(" ")}
              aria-label={`Peg ${pegLabels[peg]}`}
            >
              <div className="text-sm text-gray-600 mb-2">
                Słupek <b>{pegLabels[peg]}</b>{" "}
                {top ? `(top: ${top})` : `(pusty)`}
              </div>

              <div className="w-full flex flex-col items-center gap-2">
                {stack
                  .slice()
                  .reverse()
                  .map((d, i) => {
                    const widthPct = 25 + (d / disks) * 70;
                    return (
                      <div
                        key={`${peg}-${d}-${i}`}
                        className="h-6 rounded border bg-gray-100"
                        style={{ width: `${widthPct}%` }}
                        title={`Disk ${d}`}
                      />
                    );
                  })}
              </div>
            </button>
          );
        })}
      </div>

      <FinishModal
        open={finished}
        title="🎉 Ukończone!"
        subtitle="Przeniosłeś wszystkie krążki. Wynik zapisany w historii."
        savingMsg={savingMsg}
        onPlayAgain={() => newGame(disks)}
      />
    </main>
  );
}
