import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { registerSchema } from "@/lib/validators";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import {
  sessionCookieName,
  sessionDurationMs,
  signSession,
} from "@/lib/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Ya existe una cuenta con ese correo." },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password);
  const user = await db.user.create({ data: { name, email, passwordHash } });

  const token = await signSession({ userId: user.id });
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionDurationMs / 1000,
  });

  return NextResponse.json(
    { user: { id: user.id, name: user.name, email: user.email } },
    { status: 201 },
  );
}
