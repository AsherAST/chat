import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

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

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  io.attach(server);

  io.on("connection", (socket) => {
    console.log(`[socket] conectado: ${socket.id}`);

    socket.on("ping", (cb?: (pong: string) => void) => {
      if (typeof cb === "function") cb("pong");
    });

    socket.on("disconnect", () => {
      console.log(`[socket] desconectado: ${socket.id}`);
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
