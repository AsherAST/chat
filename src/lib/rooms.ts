import { db } from "@/lib/db";

export type MessageWithUser = {
  id: string;
  content: string;
  userId: string;
  roomId: string;
  createdAt: string;
  user: { id: string; name: string };
};

export async function getRoomById(id: string) {
  return db.room.findUnique({ where: { id } });
}

export async function getRoomMessages(
  id: string,
): Promise<MessageWithUser[]> {
  const messages = await db.message.findMany({
    where: { roomId: id },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { id: true, name: true } } },
  });
  return messages.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }));
}

export async function createRoom(data: {
  name: string;
  description?: string;
  ownerId: string;
}) {
  return db.room.create({ data });
}
