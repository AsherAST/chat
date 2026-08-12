// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { roomFindUnique, messageFindMany, messageCreate, roomCreate } =
  vi.hoisted(() => ({
    roomFindUnique: vi.fn(),
    messageFindMany: vi.fn(),
    messageCreate: vi.fn(),
    roomCreate: vi.fn(),
  }));

vi.mock("@/lib/db", () => ({
  db: {
    room: { findUnique: roomFindUnique, create: roomCreate },
    message: { findMany: messageFindMany, create: messageCreate },
  },
}));

import {
  createRoom,
  getRoomById,
  getRoomMessages,
} from "@/lib/rooms";

describe("rooms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getRoomById consulta por id", async () => {
    roomFindUnique.mockResolvedValue({ id: "r1" });
    const room = await getRoomById("r1");
    expect(room).toEqual({ id: "r1" });
    expect(roomFindUnique).toHaveBeenCalledWith({ where: { id: "r1" } });
  });

  it("getRoomMessages devuelve mensajes con user y fecha ISO", async () => {
    const createdAt = new Date("2026-08-12T10:00:00Z");
    messageFindMany.mockResolvedValue([
      {
        id: "m1",
        content: "hola",
        userId: "u1",
        roomId: "r1",
        createdAt,
        user: { id: "u1", name: "Ana" },
      },
    ]);

    const messages = await getRoomMessages("r1");
    expect(messages).toEqual([
      {
        id: "m1",
        content: "hola",
        userId: "u1",
        roomId: "r1",
        createdAt: "2026-08-12T10:00:00.000Z",
        user: { id: "u1", name: "Ana" },
      },
    ]);
    expect(messageFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { roomId: "r1" },
        orderBy: { createdAt: "asc" },
      }),
    );
  });

  it("createRoom crea una sala con owner", async () => {
    roomCreate.mockResolvedValue({ id: "r2" });
    const room = await createRoom({
      name: "Backend",
      description: "API y BD",
      ownerId: "u1",
    });
    expect(room).toEqual({ id: "r2" });
    expect(roomCreate).toHaveBeenCalledWith({
      data: { name: "Backend", description: "API y BD", ownerId: "u1" },
    });
  });
});
