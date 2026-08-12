import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export default async function Home() {
  const user = await getSessionUser();
  if (user) redirect("/salas");

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight">ChatApp</h1>
      <p className="max-w-md text-zinc-500">
        Chat en tiempo real con salas, historial y presencia de usuarios.
        Construido con Next.js, Socket.io, Prisma y PostgreSQL.
      </p>
      <div className="flex items-center gap-3">
        <Link
          href="/registro"
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Crear cuenta
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300"
        >
          Iniciar sesión
        </Link>
      </div>
    </div>
  );
}
