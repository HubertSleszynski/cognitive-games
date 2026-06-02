import Link from "next/link";

const games = [
  { href: "/games/memory", name: "Memory", desc: "Pamięć krótkotrwała: pary, ruchy, błędy, czas." },
  { href: "/games/sequence-memory", name: "Sequence Memory", desc: "Odtwarzanie sekwencji (Simon)." },
  { href: "/games/sudoku", name: "Sudoku", desc: "Wnioskowanie logiczne: czas, błędy, podpowiedzi." },
  { href: "/games/slider", name: "Puzzle Slider", desc: "Planowanie przestrzenne: ruchy i czas." },
  { href: "/games/hanoi", name: "Wieża Hanoi", desc: "Planowanie: ruchy vs optimum." },
];

export default function GamesPage() {
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Gry</h1>
      <p className="text-sm text-gray-600">Wybierz grę do treningu.</p>

      <div className="grid gap-3">
        {games.map((g) => (
          <Link key={g.href} href={g.href} className="border rounded p-4 hover:bg-gray-50">
            <div className="font-semibold">{g.name}</div>
            <div className="text-sm text-gray-600">{g.desc}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
