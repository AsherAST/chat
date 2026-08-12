import "dotenv/config";
import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { parse } from "node:querystring";
import { sessionCookieName, verifySessionToken } from "@/lib/session";
import { db } from "@/lib/db";
import { messageContentSchema } from "@/lib/validators";

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const io = new Server({
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL ?? "*",
    credentials: true,
  },
});

function getCookie(cookieHeader: string | undefined, name: string) {
  if (!cookieHeader) return null;
  const value = parse(cookieHeader.replaceAll("; ", "&"))[name];
  return typeof value === "string" ? value : null;
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  io.attach(server);

  type PresentUser = { id: string; name: string };
  const roomPresence = new Map<
    string,
    Map<string, { name: string; sockets: Set<string> }>
  >();

  function getPresence(roomId: string): PresentUser[] {
    const users = roomPresence.get(`room:${roomId}`);
    if (!users) return [];
    return [...users.entries()].map(([id, { name }]) => ({ id, name }));
  }

  function addToPresence(
    roomId: string,
    socketId: string,
    user: { id: string; name: string },
  ) {
    const key = `room:${roomId}`;
    let users = roomPresence.get(key);
    if (!users) {
      users = new Map();
      roomPresence.set(key, users);
    }
    let entry = users.get(user.id);
    if (!entry) {
      entry = { name: user.name, sockets: new Set() };
      users.set(user.id, entry);
    }
    entry.sockets.add(socketId);
  }

  function removeFromPresence(
    roomId: string,
    socketId: string,
    userId: string,
  ) {
    const users = roomPresence.get(`room:${roomId}`);
    if (!users) return;
    const entry = users.get(userId);
    if (!entry) return;
    entry.sockets.delete(socketId);
    if (entry.sockets.size === 0) {
      users.delete(userId);
      if (users.size === 0) roomPresence.delete(`room:${roomId}`);
    }
  }

  io.use(async (socket, next) => {
    const token = getCookie(
      socket.handshake.headers.cookie,
      sessionCookieName,
    );
    if (!token) return next(new Error("No autorizado"));

    const payload = await verifySessionToken(token);
    if (!payload) return next(new Error("No autorizado"));

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true },
    });
    if (!user) return next(new Error("No autorizado"));

    socket.data.user = user;
    next();
  });

  io.on("connection", (socket) => {
    const user = socket.data.user as { id: string; name: string };
    const joinedRooms = new Set<string>();
    socket.data.joinedRooms = joinedRooms;
    console.log(`[socket] ${user.name} conectado: ${socket.id}`);

    socket.on("room:join", (roomId: string) => {
      if (typeof roomId !== "string" || !roomId) return;
      socket.join(`room:${roomId}`);
      joinedRooms.add(roomId);
      const wasEmpty = getPresence(roomId).length === 0;
      addToPresence(roomId, socket.id, user);
      const presence = getPresence(roomId);
      if (wasEmpty) {
        socket.emit("presence:update", presence);
      } else {
        io.to(`room:${roomId}`).emit("presence:update", presence);
      }
      console.log(`[socket] ${user.name} entró a sala ${roomId}`);
    });

    socket.on("room:leave", (roomId: string) => {
      if (typeof roomId !== "string" || !roomId) return;
      socket.leave(`room:${roomId}`);
      joinedRooms.delete(roomId);
      removeFromPresence(roomId, socket.id, user.id);
      io.to(`room:${roomId}`).emit("presence:update", getPresence(roomId));
    });

    socket.on("typing:start", (roomId: string) => {
      if (typeof roomId !== "string" || !roomId) return;
      socket.to(`room:${roomId}`).emit("typing:start", {
        userId: user.id,
        name: user.name,
      });
    });

    socket.on("typing:stop", (roomId: string) => {
      if (typeof roomId !== "string" || !roomId) return;
      socket.to(`room:${roomId}`).emit("typing:stop", { userId: user.id });
    });

    socket.on("message:send", async (data, ack) => {
      const { roomId, content } = (data ?? {}) as {
        roomId?: string;
        content?: string;
      };

      const parsed = messageContentSchema.safeParse(content);
      if (!roomId || !parsed.success) {
        if (typeof ack === "function")
          ack({ ok: false, error: "Mensaje inválido" });
        return;
      }

      const room = await db.room.findUnique({ where: { id: roomId } });
      if (!room) {
        if (typeof ack === "function")
          ack({ ok: false, error: "La sala no existe" });
        return;
      }

      const message = await db.message.create({
        data: { content: parsed.data, roomId, userId: user.id },
        include: { user: { select: { id: true, name: true } } },
      });

      io.to(`room:${roomId}`).emit("message:new", {
        id: message.id,
        content: message.content,
        userId: message.userId,
        roomId: message.roomId,
        createdAt: message.createdAt.toISOString(),
        user: message.user,
      });

      if (typeof ack === "function") ack({ ok: true });
    });

    socket.on("ping", (cb?: (pong: string) => void) => {
      if (typeof cb === "function") cb("pong");
    });

    socket.on("disconnect", () => {
      const rooms = (socket.data.joinedRooms as Set<string>) ?? new Set();
      for (const roomId of rooms) {
        removeFromPresence(roomId, socket.id, user.id);
        io.to(`room:${roomId}`).emit("presence:update", getPresence(roomId));
      }
      console.log(`[socket] ${user.name} desconectado: ${socket.id}`);
    });
  });

  server.listen(port, () => {
    console.log(
      `> Server listening at http://localhost:${port} as ${
        dev ? "development" : process.env.NODE_ENV
      }`,
    );
  });
});
