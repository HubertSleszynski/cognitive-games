"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Attempt = {
  id: string;
  game: string;
  difficulty: number;
  durationMs: number;
  moves: number | null;
  errors: number | null;
  endedAt: string;
};

const gameOptions = [
  { value: "", label: "Wszystkie" },
  { value: "MEMORY", label: "Memory" },
  { value: "SEQUENCE_MEMORY", label: "Sequence Memory" },
  { value: "SUDOKU", label: "Sudoku" },
  { value: "SLIDER", label: "Puzzle Slider" },
  { value: "HANOI", label: "Wieża Hanoi" },
];

export default function HistoryPage() {
  const [game, setGame] = useState("");
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const url = useMemo(() => {
    const qs = new URLSearchParams();
    if (game) qs.set("game", game);
    qs.set("take", "100");
    return `/api/attempts?${qs.toString()}`;
  }, [game]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      const res = await fetch(url);
      const data = await res.json().catch(() => ({}));
      if (cancelled) return;

      if (!res.ok) {
        setError(data?.error || "Błąd pobierania historii");
        setAttempts([]);
      } else {
        setAttempts(data.attempts || []);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Historia wyników</h1>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-700">Gra:</label>
        <select
          className="border rounded p-2"
          value={game}
          onChange={(e) => setGame(e.target.value)}
        >
          {gameOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-sm text-gray-600">Ładowanie...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Data</th>
              <th className="text-left p-2">Gra</th>
              <th className="text-left p-2">Trudność</th>
              <th className="text-left p-2">Czas</th>
              <th className="text-left p-2">Ruchy</th>
              <th className="text-left p-2">Błędy</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="p-2">{new Date(a.endedAt).toLocaleString()}</td>
                <td className="p-2">{a.game}</td>
                <td className="p-2">{a.difficulty}</td>
                <td className="p-2">{Math.round(a.durationMs / 1000)}s</td>
                <td className="p-2">{a.moves ?? "-"}</td>
                <td className="p-2">{a.errors ?? "-"}</td>
              </tr>
            ))}
            {(!loading && attempts.length === 0) && (
              <tr>
                <td className="p-2 text-gray-600" colSpan={6}>
                  Brak wyników.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
