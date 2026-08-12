import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../password";

describe("password", () => {
  it("hash correcto y verificación de la contraseña", async () => {
    const hash = await hashPassword("mi-clave-secreta");
    expect(hash).not.toContain("mi-clave-secreta");
    expect(await verifyPassword("mi-clave-secreta", hash)).toBe(true);
  });

  it("rechaza una contraseña incorrecta", async () => {
    const hash = await hashPassword("clave-a");
    expect(await verifyPassword("clave-b", hash)).toBe(false);
  });
});
