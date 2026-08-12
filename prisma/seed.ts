import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/password";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const db = new PrismaClient({ adapter });

async function main() {
  const demo = await db.user.upsert({
    where: { email: "demo@chat.cl" },
    update: {},
    create: {
      name: "Damian",
      email: "demo@chat.cl",
      passwordHash: await hashPassword("demo1234"),
    },
  });

  const guest = await db.user.upsert({
    where: { email: "guest@chat.cl" },
    update: {},
    create: {
      name: "Invitado",
      email: "guest@chat.cl",
      passwordHash: await hashPassword("guest1234"),
    },
  });

  const general = await db.room.upsert({
    where: { id: "room-general" },
    update: { name: "General" },
    create: {
      id: "room-general",
      name: "General",
      description: "Sala principal para cualquier tema",
      ownerId: demo.id,
    },
  });

  const frontend = await db.room.upsert({
    where: { id: "room-frontend" },
    update: { name: "Frontend" },
    create: {
      id: "room-frontend",
      name: "Frontend",
      description: "React, Next.js y CSS",
      ownerId: demo.id,
    },
  });

  const off = await db.room.upsert({
    where: { id: "room-offtopic" },
    update: { name: "Off-topic" },
    create: {
      id: "room-offtopic",
      name: "Off-topic",
      description: "Todo lo demás",
      ownerId: demo.id,
    },
  });

  await db.message.deleteMany({});
  await db.message.createMany({
    data: [
      {
        content: "¡Bienvenidos al chat en tiempo real! 🎉",
        userId: demo.id,
        roomId: general.id,
      },
      {
        content: "Este mensaje llegó desde el seed con Socket.io y Neon.",
        userId: guest.id,
        roomId: general.id,
      },
      {
        content: "Prueba el historial: los mensajes se guardan en PostgreSQL.",
        userId: demo.id,
        roomId: general.id,
      },
      {
        content: "¿Alguien probó Next.js 16 con Turbopack?",
        userId: demo.id,
        roomId: frontend.id,
      },
      {
        content: "Sí, el build es rapidísimo.",
        userId: guest.id,
        roomId: frontend.id,
      },
      {
        content: "¿Alguien jugó hoy?",
        userId: demo.id,
        roomId: off.id,
      },
    ],
  });

  console.log("Seed completado: 2 usuarios, 3 salas, 6 mensajes.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
