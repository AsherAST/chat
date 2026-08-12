export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-6 px-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight">ChatApp</h1>
      <p className="max-w-md text-zinc-500">
        Chat en tiempo real con salas, historial y presencia de usuarios.
        Construido con Next.js, Socket.io, Prisma y PostgreSQL.
      </p>
      <p className="text-sm text-zinc-400">
        Login, registro y salas disponibles próximamente.
      </p>
    </div>
  );
}
