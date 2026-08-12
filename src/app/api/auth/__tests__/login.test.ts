// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { setCookie, findUniqueMock } = vi.hoisted(() => ({
  setCookie: vi.fn(),
  findUniqueMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    set: setCookie,
    get: vi.fn(),
    delete: vi.fn(),
  }),
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: { findUnique: findUniqueMock },
  },
}));

vi.mock("@/lib/password", () => ({
  verifyPassword: async (password: string, hash: string) =>
    password === hash,
}));

vi.mock("@/lib/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/session")>();
  return {
    ...actual,
    signSession: async () => "fake-session-token",
  };
});

import { POST } from "@/app/api/auth/login/route";

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inicia sesión con credenciales válidas (200) y setea cookie", async () => {
    findUniqueMock.mockResolvedValue({
      id: "u1",
      email: "ana@example.com",
      passwordHash: "clave-correcta",
    });

    const res = await POST(
      jsonRequest({ email: "ana@example.com", password: "clave-correcta" }),
    );
    expect(res.status).toBe(200);

    expect(setCookie).toHaveBeenCalledWith(
      "chat_session",
      expect.any(String),
      expect.objectContaining({ httpOnly: true }),
    );

    const body = await res.json();
    expect(body.user.email).toBe("ana@example.com");
  });

  it("rechaza contraseña incorrecta (401)", async () => {
    findUniqueMock.mockResolvedValue({
      id: "u1",
      email: "ana@example.com",
      passwordHash: "otra-clave",
    });

    const res = await POST(
      jsonRequest({ email: "ana@example.com", password: "incorrecta" }),
    );
    expect(res.status).toBe(401);
    expect(setCookie).not.toHaveBeenCalled();
  });

  it("rechaza usuario inexistente (401) sin filtrar existencia", async () => {
    findUniqueMock.mockResolvedValue(null);
    const res = await POST(
      jsonRequest({ email: "nadie@example.com", password: "clave" }),
    );
    expect(res.status).toBe(401);
  });

  it("rechaza cuerpo inválido (400)", async () => {
    const res = await POST(jsonRequest({}));
    expect(res.status).toBe(400);
  });
});
