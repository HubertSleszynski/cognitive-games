"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FinishModal } from "@/components/FinishModal";

type Difficulty = 1 | 2 | 3;

type Card = {
  id: string;
  value: string;
  matched: boolean;
};

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MemoryGamePage() {
  const [difficulty, setDifficulty] = useState<Difficulty>(1);

  const boardSize = difficulty === 1 ? 4 : difficulty === 2 ? 6 : 8;

  const symbolsEasy = useMemo(
    () => ["🍎", "🚗", "🎲", "🐶", "🌟", "🎧", "⚽", "🍕"],
    []
  );

  const symbolsMedium = useMemo(
    () => [
      "🍎",
      "🚗",
      "🎲",
      "🐶",
      "🌟",
      "🎧",
      "⚽",
      "🍕",
      "🧠",
      "🎯",
      "🍩",
      "🦊",
      "🧩",
      "🎹",
      "🚀",
      "🍉",
      "🦁",
      "📌",
    ],
    []
  );

  const symbolsHard = useMemo(
    () => [
      "🍎",
      "🚗",
      "🎲",
      "🐶",
      "🌟",
      "🎧",
      "⚽",
      "🍕",
      "🧠",
      "🎯",
      "🍩",
      "🦊",
      "🧩",
      "🎹",
      "🚀",
      "🍉",
      "🦁",
      "📌",
      "🐸",
      "🍓",
      "🧊",
      "🎁",
      "📚",
      "🧸",
      "🧪",
      "🛰️",
      "🧵",
      "🎨",
      "🦋",
      "🍄",
      "🕹️",
      "🎈",
    ],
    []
  );

  function getSymbolsFor(d: Difficulty) {
    return d === 1 ? symbolsEasy : d === 2 ? symbolsMedium : symbolsHard;
  }

  function buildDeck(d: Difficulty): Card[] {
    const symbols = getSymbolsFor(d);
    const doubled = [...symbols, ...symbols];
    const shuffled = shuffle(doubled);

    return shuffled.map((value, idx) => ({
      id: `${value}-${idx}`,
      value,
      matched: false,
    }));
  }

  const [cards, setCards] = useState<Card[]>(() => buildDeck(1));
  const [flipped, setFlipped] = useState<string[]>([]);
  const [locked, setLocked] = useState(false);

  const [moves, setMoves] = useState(0);
  const [errors, setErrors] = useState(0);

  const startedAtRef = useRef<Date | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const [finished, setFinished] = useState(false);
  const [savingMsg, setSavingMsg] = useState("");

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!startedAtRef.current || finished) return;
      setElapsedMs(Date.now() - startedAtRef.current.getTime());
    }, 250);

    return () => window.clearInterval(id);
  }, [finished]);

  function startNewGame(nextDifficulty: Difficulty) {
    setDifficulty(nextDifficulty);
    setFinished(false);
    setSavingMsg("");
    setMoves(0);
    setErrors(0);
    setFlipped([]);
    setLocked(false);
    startedAtRef.current = null;
    setElapsedMs(0);
    setCards(buildDeck(nextDifficulty));
  }

  function resetSameDifficulty() {
    startNewGame(difficulty);
  }

  function isFaceUp(card: Card) {
    return flipped.includes(card.id) || card.matched;
  }

  async function saveAttempt(end: Date) {
    if (!startedAtRef.current) return;

    const startedAt = startedAtRef.current;
    const durationMs = end.getTime() - startedAt.getTime();

    setSavingMsg("Zapisuję wynik...");

    const payload = {
      game: "MEMORY",
      difficulty,
      startedAt: startedAt.toISOString(),
      endedAt: end.toISOString(),
      durationMs,
      moves,
      errors,
      details: {
        board: `${boardSize}x${boardSize}`,
        pairs: getSymbolsFor(difficulty).length,
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

  function onCardClick(card: Card) {
    if (locked) return;
    if (finished) return;
    if (card.matched) return;
    if (flipped.includes(card.id)) return;

    if (!startedAtRef.current) {
      startedAtRef.current = new Date();
      setElapsedMs(0);
    }

    const nextFlipped = [...flipped, card.id];
    setFlipped(nextFlipped);

    if (nextFlipped.length === 2) {
      setLocked(true);
      setMoves(m => m + 1);

      const [id1, id2] = nextFlipped;
      const c1 = cards.find(c => c.id === id1)!;
      const c2 = cards.find(c => c.id === id2)!;

      const match = c1.value === c2.value;

      setTimeout(async () => {
        if (match) {
          const updated = cards.map(c =>
            c.id === id1 || c.id === id2 ? { ...c, matched: true } : c
          );
          setCards(updated);
          setFlipped([]);
          setLocked(false);

          const allMatched = updated.every(c => c.matched);
          if (allMatched) {
            const end = new Date();
            setFinished(true);
            await saveAttempt(end);
          }
        } else {
          setErrors(e => e + 1);
          setFlipped([]);
          setLocked(false);
        }
      }, 650);
    }
  }

  const minutes = Math.floor(elapsedMs / 60000);
  const seconds = Math.floor((elapsedMs % 60000) / 1000);
  const timeText =
    startedAtRef.current == null
      ? "00:00"
      : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
          2,
          "0"
        )}`;

  const colsStyle = {
    gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))`,
  };

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Memory</h1>
          <p className="text-sm text-gray-600">
            Dopasuj wszystkie pary. Zapisywane metryki: czas, poprawne pary i błędy.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            className="border rounded px-3 py-2 hover:bg-gray-50"
            onClick={resetSameDifficulty}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-gray-700">
        <div className="border rounded px-3 py-2">
          Tryb:{" "}
          <b>
            {difficulty === 1
              ? "Łatwy 4×4"
              : difficulty === 2
              ? "Średni 6×6"
              : "Trudny 8×8"}
          </b>
        </div>
        <div className="border rounded px-3 py-2">
          Czas: <b>{timeText}</b>
        </div>
        <div className="border rounded px-3 py-2">
          Ruchy: <b>{moves}</b>
        </div>
        <div className="border rounded px-3 py-2">
          Błędy: <b>{errors}</b>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-gray-700">Wybierz tryb:</span>

        <button
          className={`border rounded px-3 py-2 hover:bg-gray-50 ${
            difficulty === 1 ? "font-semibold" : ""
          }`}
          onClick={() => startNewGame(1)}
        >
          Łatwy 4×4
        </button>

        <button
          className={`border rounded px-3 py-2 hover:bg-gray-50 ${
            difficulty === 2 ? "font-semibold" : ""
          }`}
          onClick={() => startNewGame(2)}
        >
          Średni 6×6
        </button>

        <button
          className={`border rounded px-3 py-2 hover:bg-gray-50 ${
            difficulty === 3 ? "font-semibold" : ""
          }`}
          onClick={() => startNewGame(3)}
        >
          Trudny 8×8
        </button>
      </div>

      <div className="grid gap-2" style={colsStyle}>
        {cards.map(card => {
          const faceUp = isFaceUp(card);
          return (
            <button
              key={card.id}
              className={[
                "aspect-square rounded border flex items-center justify-center select-none",
                boardSize >= 6 ? "text-2xl" : "text-3xl",
                faceUp ? "bg-white" : "bg-gray-100 hover:bg-gray-200",
                card.matched ? "opacity-60" : "",
              ].join(" ")}
              onClick={() => onCardClick(card)}
              aria-label="Memory card"
            >
              {faceUp ? card.value : "❓"}
            </button>
          );
        })}
      </div>

      <FinishModal
        open={finished}
        title="🎉 Ukończone!"
        subtitle="Wynik został zapisany. Możesz zagrać ponownie albo zobaczyć historię."
        savingMsg={savingMsg}
        onPlayAgain={resetSameDifficulty}
      />
    </main>
  );
}
