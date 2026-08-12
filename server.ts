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
    console.log(`[socket] ${user.name} conectado: ${socket.id}`);

    socket.on("room:join", (roomId: string) => {
      socket.join(`room:${roomId}`);
      console.log(`[socket] ${user.name} entró a sala ${roomId}`);
    });

    socket.on("room:leave", (roomId: string) => {
      socket.leave(`room:${roomId}`);
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
