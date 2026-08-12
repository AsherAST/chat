// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

const { deleteCookie } = vi.hoisted(() => ({
  deleteCookie: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    set: vi.fn(),
    get: vi.fn(),
    delete: deleteCookie,
  }),
}));

import { POST } from "@/app/api/auth/logout/route";

describe("POST /api/auth/logout", () => {
  it("elimina la cookie de sesión", async () => {
    const res = await POST();
    expect(res.status).toBe(200);
    expect(deleteCookie).toHaveBeenCalledWith("chat_session");
  });
});
