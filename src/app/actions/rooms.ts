"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createRoom } from "@/lib/rooms";
import { createRoomSchema } from "@/lib/validators";

export async function createRoomAction(formData: FormData) {
  const user = await requireUser();

  const parsed = createRoomSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) {
    redirect("/salas?error=invalid");
  }

  const room = await createRoom({
    name: parsed.data.name,
    description: parsed.data.description,
    ownerId: user.id,
  });

  refresh();
  redirect(`/salas/${room.id}`);
}
