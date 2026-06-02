import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

type Props = {
  searchParams?: Promise<{
    userId?: string;
    game?: string;
    sort?: string;
    page?: string;
  }>;
};

const PAGE_SIZE = 50;

function formatTime(ms: number) {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

function gameLabel(game: string) {
  if (game === "MEMORY") return "Memory";
  if (game === "SEQUENCE_MEMORY") return "Sequence Memory";
  if (game === "SUDOKU") return "Sudoku";
  if (game === "SLIDER") return "Puzzle Slider";
  if (game === "HANOI") return "Wieże Hanoi";
  return game;
}

function genderLabel(gender?: string | null) {
  if (gender === "FEMALE") return "Kobieta";
  if (gender === "MALE") return "Mężczyzna";
  if (gender === "OTHER") return "Inna / brak";
  return "-";
}

function experienceLabel(value?: string | null) {
  if (value === "LOW") return "Niskie";
  if (value === "MEDIUM") return "Średnie";
  if (value === "HIGH") return "Wysokie";
  return "-";
}

function pageHref(page: number, userId: string, game: string, sort: string) {
  const params = new URLSearchParams();

  if (userId) params.set("userId", userId);
  if (game) params.set("game", game);
  if (sort) params.set("sort", sort);
  params.set("page", String(page));

  return `/admin?${params.toString()}`;
}

export default async function AdminPage({ searchParams }: Props) {
  const currentUserId = await getSessionUserId();

  if (!currentUserId) {
    redirect("/login");
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: currentUserId },
    select: { role: true },
  });

  if (currentUser?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const params = (await searchParams) ?? {};

  const selectedUserId = params.userId ?? "";
  const selectedGame = params.game ?? "";
  const sort = params.sort ?? "endedAt_desc";
  const page = Math.max(1, Number(params.page ?? "1"));

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { email: "asc" }],
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  const where: any = {};

  if (selectedUserId) where.userId = selectedUserId;
  if (selectedGame) where.game = selectedGame;

  const orderBy =
    sort === "endedAt_asc"
      ? { endedAt: "asc" as const }
      : sort === "duration_asc"
      ? { durationMs: "asc" as const }
      : sort === "duration_desc"
      ? { durationMs: "desc" as const }
      : sort === "difficulty_asc"
      ? { difficulty: "asc" as const }
      : sort === "difficulty_desc"
      ? { difficulty: "desc" as const }
      : sort === "moves_asc"
      ? { moves: "asc" as const }
      : sort === "moves_desc"
      ? { moves: "desc" as const }
      : sort === "errors_asc"
      ? { errors: "asc" as const }
      : sort === "errors_desc"
      ? { errors: "desc" as const }
      : { endedAt: "desc" as const };

  const totalAttempts = await prisma.gameAttempt.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalAttempts / PAGE_SIZE));

  const safePage = Math.min(page, totalPages);

  const attempts = await prisma.gameAttempt.findMany({
    where,
    include: {
      user: true,
    },
    orderBy,
    skip: (safePage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  const from = totalAttempts === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const to = Math.min(safePage * PAGE_SIZE, totalAttempts);

  return (
    <main className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Panel administratora</h1>
        <p className="text-sm text-gray-600">
          Wszystkie wyniki gier wszystkich użytkowników.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-3">
        <div className="border rounded-xl bg-white p-4">
          <p className="text-sm text-gray-500">Użytkownicy</p>
          <p className="text-2xl font-semibold">{users.length}</p>
        </div>

        <div className="border rounded-xl bg-white p-4">
          <p className="text-sm text-gray-500">Wyniki po filtrach</p>
          <p className="text-2xl font-semibold">{totalAttempts}</p>
        </div>

        <div className="border rounded-xl bg-white p-4">
          <p className="text-sm text-gray-500">Strona</p>
          <p className="text-2xl font-semibold">
            {safePage} / {totalPages}
          </p>
        </div>

        <div className="border rounded-xl bg-white p-4">
          <p className="text-sm text-gray-500">Pokazywane rekordy</p>
          <p className="text-2xl font-semibold">
            {from}-{to}
          </p>
        </div>
      </div>

      <form className="flex flex-wrap gap-3 items-end border rounded-xl p-4 bg-white">
        <label className="text-sm">
          Użytkownik
          <select
            name="userId"
            defaultValue={selectedUserId}
            className="block border rounded p-2 mt-1 min-w-56"
          >
            <option value="">Wszyscy</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name || u.email} {u.role === "ADMIN" ? "(ADMIN)" : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          Gra
          <select
            name="game"
            defaultValue={selectedGame}
            className="block border rounded p-2 mt-1 min-w-44"
          >
            <option value="">Wszystkie</option>
            <option value="MEMORY">Memory</option>
            <option value="SEQUENCE_MEMORY">Sequence Memory</option>
            <option value="SUDOKU">Sudoku</option>
            <option value="SLIDER">Puzzle Slider</option>
            <option value="HANOI">Wieże Hanoi</option>
          </select>
        </label>

        <label className="text-sm">
          Sortowanie
          <select
            name="sort"
            defaultValue={sort}
            className="block border rounded p-2 mt-1 min-w-56"
          >
            <option value="endedAt_desc">Data gry: najnowsze</option>
            <option value="endedAt_asc">Data gry: najstarsze</option>
            <option value="duration_asc">Czas: najkrótszy</option>
            <option value="duration_desc">Czas: najdłuższy</option>
            <option value="difficulty_asc">Trudność: rosnąco</option>
            <option value="difficulty_desc">Trudność: malejąco</option>
            <option value="moves_asc">Ruchy/wynik: rosnąco</option>
            <option value="moves_desc">Ruchy/wynik: malejąco</option>
            <option value="errors_asc">Błędy: najmniej</option>
            <option value="errors_desc">Błędy: najwięcej</option>
          </select>
        </label>

        <button className="border rounded px-4 py-2 hover:bg-gray-50">
          Filtruj
        </button>

        <a className="border rounded px-4 py-2 hover:bg-gray-50" href="/admin">
          Reset filtrów
        </a>
      </form>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Wyniki gier</h2>

          <div className="flex items-center gap-2 text-sm">
            <a
              className={`border rounded px-3 py-1.5 ${
                safePage <= 1 ? "pointer-events-none opacity-40" : "hover:bg-gray-50"
              }`}
              href={pageHref(safePage - 1, selectedUserId, selectedGame, sort)}
            >
              Poprzednia
            </a>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => {
                if (p === 1 || p === totalPages) return true;
                return Math.abs(p - safePage) <= 2;
              })
              .map((p, index, arr) => {
                const prev = arr[index - 1];
                const showDots = prev && p - prev > 1;

                return (
                  <span key={p} className="flex items-center gap-2">
                    {showDots && <span className="px-1">...</span>}
                    <a
                      className={`border rounded px-3 py-1.5 ${
                        p === safePage
                          ? "bg-gray-900 text-white"
                          : "hover:bg-gray-50"
                      }`}
                      href={pageHref(p, selectedUserId, selectedGame, sort)}
                    >
                      {p}
                    </a>
                  </span>
                );
              })}

            <a
              className={`border rounded px-3 py-1.5 ${
                safePage >= totalPages
                  ? "pointer-events-none opacity-40"
                  : "hover:bg-gray-50"
              }`}
              href={pageHref(safePage + 1, selectedUserId, selectedGame, sort)}
            >
              Następna
            </a>
          </div>
        </div>

        <div className="border rounded-xl bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">Data gry</th>
                <th className="text-left p-3">Użytkownik</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Wiek</th>
                <th className="text-left p-3">Płeć</th>
                <th className="text-left p-3">Zawód</th>
                <th className="text-left p-3">Dośw. z grami</th>
                <th className="text-left p-3">Komputer</th>
                <th className="text-left p-3">Gra</th>
                <th className="text-left p-3">Trudność</th>
                <th className="text-left p-3">Czas</th>
                <th className="text-left p-3">Ruchy / wynik gry</th>
                <th className="text-left p-3">Błędy</th>
                <th className="text-left p-3">Podpowiedzi</th>
              </tr>
            </thead>

            <tbody>
              {attempts.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="p-3 whitespace-nowrap">
                    {a.endedAt.toLocaleString()}
                  </td>
                  <td className="p-3">{a.user.name || "-"}</td>
                  <td className="p-3">{a.user.email}</td>
                  <td className="p-3">{a.user.age ?? "-"}</td>
                  <td className="p-3">{genderLabel(a.user.gender)}</td>
                  <td className="p-3">{a.user.occupation ?? "-"}</td>
                  <td className="p-3">
                    {experienceLabel(a.user.gamingExperience)}
                  </td>
                  <td className="p-3">
                    {experienceLabel(a.user.computerUsage)}
                  </td>
                  <td className="p-3">{gameLabel(a.game)}</td>
                  <td className="p-3">{a.difficulty}</td>
                  <td className="p-3">{formatTime(a.durationMs)}</td>
                  <td className="p-3">{a.moves ?? "-"}</td>
                  <td className="p-3">{a.errors ?? "-"}</td>
                  <td className="p-3">{a.hintsUsed ?? "-"}</td>
                </tr>
              ))}

              {attempts.length === 0 && (
                <tr>
                  <td colSpan={14} className="p-3 text-gray-600">
                    Brak wyników dla wybranych filtrów.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-sm text-gray-600">
          Pokazano <b>{attempts.length}</b> rekordów na tej stronie.
        </p>
      </section>
    </main>
  );
}