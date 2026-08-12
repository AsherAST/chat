# ChatApp — Chat en tiempo real

Chat con salas, historial, presencia de usuarios e indicador "escribiendo…". Construido con Next.js, Socket.io, Prisma y PostgreSQL.

> En desarrollo: la creación de salas y el envío de mensajes en tiempo real se agregan en las próximas iteraciones. El registro/login/logout con sesiones JWT ya está implementado.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Socket.io para tiempo real (servidor custom de Node)
- Prisma 7 + PostgreSQL (Neon)
- Sesiones JWT (jose + bcryptjs)
- Zod para validación
- Vitest + Testing Library para tests unitarios

## Requisitos

- Node.js 22+
- Base de datos PostgreSQL (ej. Neon)

## Configuración

1. Instalar dependencias:

   ```bash
   npm ci
   ```

2. Crear el archivo `.env` (ver `.env.example`):

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

4. Ejecutar en desarrollo (custom server + Socket.io):

   ```bash
   npm run dev
   ```

## Scripts

```bash
npm run dev          # desarrollo (custom server con Socket.io)
npm run build        # build de producción
npm run start        # producción (custom server con Socket.io)
npm run lint         # eslint
npm test             # tests unitarios (vitest)
npm run db:migrate   # prisma migrate dev
npm run db:seed      # prisma db seed
npm run db:studio    # prisma studio
```
