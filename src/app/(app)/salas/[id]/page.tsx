import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getRoomById, getRoomMessages } from "@/lib/rooms";
import RoomChat from "@/components/RoomChat";

export const dynamic = "force-dynamic";

export default async function SalaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const [room, messages] = await Promise.all([
    getRoomById(id),
    getRoomMessages(id),
  ]);
  if (!room) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link
        href="/salas"
        className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
      >
        ← Volver a salas
      </Link>

      <div className="mt-3 mb-5">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          {room.name}
        </h1>
        {room.description && (
          <p className="mt-1 text-sm text-zinc-500">{room.description}</p>
        )}
      </div>

      <RoomChat
        roomId={room.id}
        currentUserId={user.id}
        initialMessages={messages}
      />
    </div>
  );
}
