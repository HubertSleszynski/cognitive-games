"use client";

import Link from "next/link";

export function FinishModal(props: {
  open: boolean;
  title: string;
  subtitle?: string;
  onPlayAgain: () => void;
  savingMsg?: string;
}) {
  if (!props.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-lg space-y-3">
        <h3 className="text-xl font-semibold">{props.title}</h3>
        {props.subtitle && <p className="text-sm text-gray-600">{props.subtitle}</p>}
        {props.savingMsg && <p className="text-sm text-gray-600">{props.savingMsg}</p>}

        <div className="flex gap-2 pt-2">
          <button
            className="border rounded-lg px-4 py-2 hover:bg-gray-50"
            onClick={props.onPlayAgain}
          >
            Zagraj jeszcze raz
          </button>
          <Link
            className="border rounded-lg px-4 py-2 hover:bg-gray-50"
            href="/history"
          >
            Zobacz wynik
          </Link>
        </div>
      </div>
    </div>
  );
}
