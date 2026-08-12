// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { setCookie, findUniqueMock, createMock } = vi.hoisted(() => ({
  setCookie: vi.fn(),
  findUniqueMock: vi.fn(),
  createMock: vi.fn(),
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
    user: { findUnique: findUniqueMock, create: createMock },
  },
}));

vi.mock("@/lib/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/session")>();
  return {
    ...actual,
    signSession: async () => "fake-session-token",
  };
});

import { POST } from "@/app/api/auth/register/route";

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  name: "Ana",
  email: "ana@example.com",
  password: "password123",
};

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("crea usuario y establece cookie de sesión (201)", async () => {
    findUniqueMock.mockResolvedValue(null);
    createMock.mockResolvedValue({
      id: "u1",
      name: "Ana",
      email: "ana@example.com",
    });

    const res = await POST(jsonRequest(validBody));
    expect(res.status).toBe(201);

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "ana@example.com",
          passwordHash: expect.any(String),
        }),
      }),
    );

    expect(setCookie).toHaveBeenCalledWith(
      "chat_session",
      expect.any(String),
      expect.objectContaining({ httpOnly: true }),
    );

    const body = await res.json();
    expect(body.user.email).toBe("ana@example.com");
  });

  it("rechaza datos inválidos (400)", async () => {
    const res = await POST(jsonRequest({ name: "A" }));
    expect(res.status).toBe(400);
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("rechaza email duplicado (409)", async () => {
    findUniqueMock.mockResolvedValue({ id: "existing" });
    const res = await POST(jsonRequest(validBody));
    expect(res.status).toBe(409);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("normaliza email a minúsculas", async () => {
    findUniqueMock.mockResolvedValue(null);
    createMock.mockResolvedValue({
      id: "u1",
      name: "Ana",
      email: "ana@example.com",
    });

    await POST(
      jsonRequest({ ...validBody, email: "ANA@Example.com" }),
    );
    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { email: "ana@example.com" },
    });
  });
});
