import { describe, expect, it } from "vitest";
import {
  createRoomSchema,
  loginSchema,
  messageContentSchema,
  registerSchema,
} from "../validators";

describe("validators", () => {
  it("registro válido normaliza email a minúsculas", () => {
    const result = registerSchema.parse({
      name: "Damian",
      email: "DEMO@Chat.cl",
      password: "demo1234",
    });
    expect(result.email).toBe("demo@chat.cl");
  });

  it("registro rechaza contraseña corta", () => {
    const result = registerSchema.safeParse({
      name: "Damian",
      email: "demo@chat.cl",
      password: "123",
    });
    expect(result.success).toBe(false);
  });

  it("login rechaza email inválido", () => {
    const result = loginSchema.safeParse({
      email: "no-es-email",
      password: "demo1234",
    });
    expect(result.success).toBe(false);
  });

  it("crear sala normaliza el nombre", () => {
    const result = createRoomSchema.parse({ name: "  General  " });
    expect(result.name).toBe("General");
  });

  it("mensaje válido y vacío rechazado", () => {
    expect(messageContentSchema.parse(" hola ")).toBe("hola");
    expect(messageContentSchema.safeParse("   ").success).toBe(false);
    expect(
      messageContentSchema.safeParse("a".repeat(1001)).success,
    ).toBe(false);
  });
});
