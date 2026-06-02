import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { AttemptsTable } from "@/components/AttemptsTable";

export default async function DashboardPage() {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  const lastAttempts = await prisma.gameAttempt.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-gray-600">
          Zalogowany jako:{" "}
          {user?.name ? `${user.name} (${user.email})` : user?.email}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Link href="/games" className="border rounded-xl p-4 bg-white hover:bg-gray-50">
          <div className="font-semibold">Gry</div>
          <div className="text-sm text-gray-600">Wybierz grę i trenuj.</div>
        </Link>

        <Link href="/history" className="border rounded-xl p-4 bg-white hover:bg-gray-50">
          <div className="font-semibold">Historia</div>
          <div className="text-sm text-gray-600">Filtruj wyniki i porównuj.</div>
        </Link>

        <div className="border rounded-xl p-4 bg-white">
          <div className="font-semibold">Wskazówka</div>
          <div className="text-sm text-gray-600">
            Najlepiej grać krótko, ale regularnie (np. 10–15 min dziennie).
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Ostatnie wyniki</h2>
        <AttemptsTable attempts={lastAttempts} />
      </section>
    </main>
  );
}
