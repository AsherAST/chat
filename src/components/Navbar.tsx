"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Navbar({
  user,
}: {
  user: { name: string; email: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/salas" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
            C
          </span>
          <span className="font-bold text-zinc-900 dark:text-white">
            ChatApp
          </span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href="/salas"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            Salas
          </Link>
          <Link
            href="/cuenta"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            {user.name}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loading}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300"
          >
            {loading ? "…" : "Salir"}
          </button>
        </nav>
      </div>
    </header>
  );
}
