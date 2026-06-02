"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    age: "",
    gender: "",
    education: "",
    occupation: "",
    gamingExperience: "",
    computerUsage: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(name: string, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload = {
      ...form,
      age: Number(form.age),
    };

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data?.error || "Błąd rejestracji");
      setLoading(false);
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <main className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Rejestracja</h1>

      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="w-full border rounded p-2"
          placeholder="Imię i nazwisko / pseudonim"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
        />

        <input
          className="w-full border rounded p-2"
          placeholder="Email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
        />

        <input
          className="w-full border rounded p-2"
          placeholder="Hasło min. 6 znaków"
          type="password"
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
        />

        <input
          className="w-full border rounded p-2"
          placeholder="Wiek"
          type="number"
          value={form.age}
          onChange={(e) => update("age", e.target.value)}
        />

        <select
          className="w-full border rounded p-2"
          value={form.gender}
          onChange={(e) => update("gender", e.target.value)}
        >
          <option value="">Płeć</option>
          <option value="FEMALE">Kobieta</option>
          <option value="MALE">Mężczyzna</option>
          <option value="OTHER">Inna / wolę nie podawać</option>
        </select>

        <select
          className="w-full border rounded p-2"
          value={form.education}
          onChange={(e) => update("education", e.target.value)}
        >
          <option value="">Wykształcenie</option>
          <option value="PRIMARY">Podstawowe</option>
          <option value="SECONDARY">Średnie</option>
          <option value="BACHELOR">Licencjat / inżynier</option>
          <option value="MASTER">Magisterskie</option>
          <option value="OTHER">Inne</option>
        </select>

        <input
          className="w-full border rounded p-2"
          placeholder="Zawód / status, np. student, programista"
          value={form.occupation}
          onChange={(e) => update("occupation", e.target.value)}
        />

        <select
          className="w-full border rounded p-2"
          value={form.gamingExperience}
          onChange={(e) => update("gamingExperience", e.target.value)}
        >
          <option value="">Doświadczenie z grami</option>
          <option value="LOW">Niskie</option>
          <option value="MEDIUM">Średnie</option>
          <option value="HIGH">Wysokie</option>
        </select>

        <select
          className="w-full border rounded p-2"
          value={form.computerUsage}
          onChange={(e) => update("computerUsage", e.target.value)}
        >
          <option value="">Częstotliwość korzystania z komputera</option>
          <option value="LOW">Rzadko</option>
          <option value="MEDIUM">Kilka razy w tygodniu</option>
          <option value="HIGH">Codziennie</option>
        </select>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          disabled={loading}
          className="w-full border rounded p-2 hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? "Tworzenie konta..." : "Załóż konto"}
        </button>
      </form>

      <p className="text-sm text-gray-600">
        Masz już konto?{" "}
        <Link className="underline" href="/login">
          Zaloguj się!
        </Link>
      </p>
    </main>
  );
}