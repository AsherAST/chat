import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-secret-change-me",
);

export const sessionCookieName = "chat_session";
export const sessionDurationMs = 7 * 24 * 60 * 60 * 1000;

export type SessionPayload = {
  userId: string;
};

export async function signSession(
  payload: SessionPayload,
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (typeof payload.userId !== "string") return null;
    return { userId: payload.userId };
  } catch {
    return null;
  }
}
