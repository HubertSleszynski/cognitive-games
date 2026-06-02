type AttemptRow = {
  id: string;
  game: string;
  difficulty: number;
  durationMs: number;
  moves: number | null;
  errors: number | null;
  createdAt: Date;
};

export function AttemptsTable({ attempts }: { attempts: AttemptRow[] }) {
  return (
    <div className="border rounded-xl overflow-x-auto bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-3">Data</th>
            <th className="text-left p-3">Gra</th>
            <th className="text-left p-3">Trudność</th>
            <th className="text-left p-3">Czas</th>
            <th className="text-left p-3">Ruchy</th>
            <th className="text-left p-3">Błędy</th>
          </tr>
        </thead>
        <tbody>
          {attempts.map((a) => (
            <tr key={a.id} className="border-t">
              <td className="p-3">{a.createdAt.toLocaleString()}</td>
              <td className="p-3">{a.game}</td>
              <td className="p-3">{a.difficulty}</td>
              <td className="p-3">{Math.round(a.durationMs / 1000)}s</td>
              <td className="p-3">{a.moves ?? "-"}</td>
              <td className="p-3">{a.errors ?? "-"}</td>
            </tr>
          ))}
          {attempts.length === 0 && (
            <tr>
              <td className="p-3 text-gray-600" colSpan={6}>
                Brak wyników.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
