# Chat en tiempo real

Aplicación de chat por salas en tiempo real con Socket.io: autenticación con sesiones JWT propias, mensajes persistentes, indicador de "escribiendo…" y presencia de usuarios online. Construido con Next.js, Prisma, PostgreSQL (Neon) y un custom server Node para Socket.io.

## Características

- **Salas y mensajes**: crear salas, entrar desde la lista, historial de mensajes cargado desde la base de datos y envío en tiempo real con confirmación (ack).
- **Tiempo real**: los mensajes se emiten a la sala con Socket.io y se persisten en PostgreSQL. Verificado con dos clientes conversando simultáneamente.
- **Presencia**: lista de usuarios en línea por sala (avatares con inicial + conteo), actualizada al entrar, salir o desconectarse.
- **"Escribiendo…"**: indicador en vivo de quién está escribiendo (throttle de emisión 1.5 s, auto-stop tras 3 s, se detiene al enviar).
- **Autenticación propia**: registro/login con bcryptjs, sesiones JWT (jose) en cookies httpOnly de 7 días, protección de rutas y de conexiones de Socket.io.
- **UI**: Next.js App Router, Tailwind CSS, diseño responsive con modo oscuro.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Custom server Node (`server.ts`) con Socket.io 4
- Prisma 7 + PostgreSQL (Neon)
- Sesiones JWT propias (jose) + bcryptjs
- Zod para validación
- Vitest + Testing Library para tests unitarios

## Requisitos

- Node.js 22+
- Base de datos PostgreSQL (ej. Neon)

## Configuración

1. Clonar el repositorio e instalar dependencias:

   ```bash
   npm ci
   ```

2. Crear el archivo `.env` con las variables de entorno (ver `.env.example`):

   ```
   DATABASE_URL="postgresql://USER:PASSWORD@HOST/chat"
   DATABASE_URL_UNPOOLED="postgresql://USER:PASSWORD@HOST/chat?sslmode=require"
   AUTH_SECRET="generar-con: openssl rand -hex 32"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

3. Aplicar migraciones y sembrar datos de ejemplo:

   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

4. Ejecutar en desarrollo:

   ```bash
   npm run dev
   ```

## Usuarios de prueba

| Usuario  | Email             | Password   |
| -------- | ----------------- | ---------- |
| Demo     | `demo@chat.cl`    | `demo1234` |
| Invitado | `guest@chat.cl`   | `guest1234` |

## Scripts

```bash
npm run dev          # desarrollo (custom server + Socket.io, http://localhost:3000)
npm run build        # build de producción
npm run start        # producción (custom server + Socket.io)
npm run lint         # eslint
npm test             # tests unitarios (vitest)
npm run db:migrate   # prisma migrate dev
npm run db:seed      # prisma db seed
npm run db:studio    # prisma studio
```

## CI

GitHub Actions ejecuta lint, tests y build en cada push a `main` y pull request.

## Deploy

Requiere un proceso Node persistente (custom server + Socket.io), por lo que no se despliega en Vercel. Probado en Suga con Dockerfile y `Procfile` (raíz y health OK); el acceso a la base de datos desde el proveedor quedó pendiente de configuración de red (IP allow en Neon).

## Estructura relevante

- `server.ts`: custom server con Socket.io, auth de sockets por cookie JWT, presencia por sala, eventos `room:join/leave`, `typing:start/stop`, `message:send` (persiste y emite `message:new`).
- `src/lib/session.ts` / `src/lib/auth.ts`: sesiones JWT y helpers de autenticación.
- `src/lib/rooms.ts`: acceso a datos de salas y mensajes.
- `src/app/(app)/salas/`: lista de salas y página de sala con historial.
- `src/components/RoomChat.tsx`: cliente del chat (mensajes, presencia, "escribiendo…").
