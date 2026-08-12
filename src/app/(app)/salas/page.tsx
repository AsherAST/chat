import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SalasPage() {
  const rooms = await db.room.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { messages: true } } },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
        Salas
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Elige una sala para empezar a chatear (tiempo real disponible
        próximamente).
      </p>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => (
          <li
            key={room.id}
            className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              {room.name}
            </h2>
            {room.description && (
              <p className="mt-1 text-sm text-zinc-500">{room.description}</p>
            )}
            <p className="mt-3 text-xs text-zinc-400">
              {room._count.messages} mensajes
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
