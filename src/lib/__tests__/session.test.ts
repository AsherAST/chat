// @vitest-environment node
import { describe, expect, it } from "vitest";
import { signSession, verifySessionToken } from "../session";

describe("session", () => {
  it("firma y verifica un token válido", async () => {
    const token = await signSession({ userId: "user-1" });
    const payload = await verifySessionToken(token);
    expect(payload).toEqual({ userId: "user-1" });
  });

  it("devuelve null para un token inválido", async () => {
    const payload = await verifySessionToken("token-invalido");
    expect(payload).toBeNull();
  });

  it("devuelve null si el token no tiene userId", async () => {
    const { SignJWT } = await import("jose");
    const secret = new TextEncoder().encode(
      process.env.AUTH_SECRET ?? "dev-secret-change-me",
    );
    const token = await new SignJWT({ foo: "bar" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(secret);
    const payload = await verifySessionToken(token);
    expect(payload).toBeNull();
  });
});
