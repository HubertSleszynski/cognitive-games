"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
};

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);

  async function loadUser() {
    const res = await fetch("/api/me", {
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({ user: null }));
    setUser(data.user ?? null);
    setLoaded(true);
  }

  useEffect(() => {
    loadUser();
  }, []);

  async function logout() {
    await fetch("/api/logout", {
      method: "POST",
      cache: "no-store",
    });

    setUser(null);
    window.location.href = "/login";
  }

  return (
    <header className="border-b bg-white">
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link href={user ? "/dashboard" : "/register"} className="font-semibold">
          Cognitive Games
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          {!loaded ? null : user ? (
            <>
              <Link className="hover:underline" href="/dashboard">
                Dashboard
              </Link>
              <Link className="hover:underline" href="/games">
                Games
              </Link>
              <Link className="hover:underline" href="/history">
                History
              </Link>

              {user.role === "ADMIN" && (
                <Link className="hover:underline" href="/admin">
                  Admin
                </Link>
              )}

              <button
                onClick={logout}
                className="border rounded-lg px-3 py-1.5 hover:bg-gray-50"
              >
                Wyloguj
              </button>
            </>
          ) : (
            <>
              <Link className="hover:underline" href="/login">
                Login
              </Link>
              <Link
                className="border rounded-lg px-3 py-1.5 hover:bg-gray-50"
                href="/register"
              >
                Rejestracja
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}