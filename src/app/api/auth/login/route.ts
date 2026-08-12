import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { loginSchema } from "@/lib/validators";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import {
  sessionCookieName,
  sessionDurationMs,
  signSession,
} from "@/lib/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }

  const { email, password } = parsed.data;

  const user = await db.user.findUnique({ where: { email } });
  const valid =
    user && (await verifyPassword(password, user.passwordHash));

  if (!user || !valid) {
    return NextResponse.json(
      { error: "Correo o contraseña incorrectos." },
      { status: 401 },
    );
  }

  const token = await signSession({ userId: user.id });
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionDurationMs / 1000,
  });

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email },
  });
}
