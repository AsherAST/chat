import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthForm from "@/components/AuthForm";

const { routerPush, routerRefresh, fetchMock } = vi.hoisted(() => ({
  routerPush: vi.fn(),
  routerRefresh: vi.fn(),
  fetchMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush, refresh: routerRefresh }),
}));

vi.stubGlobal("fetch", fetchMock);

describe("AuthForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("modo login: envía credenciales y navega a /salas", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    render(<AuthForm mode="login" />);

    expect(
      screen.getByRole("heading", { name: "Iniciar sesión" }),
    ).toBeInTheDocument();

    await userEvent.type(
      screen.getByLabelText("Correo electrónico"),
      "ana@example.com",
    );
    await userEvent.type(screen.getByLabelText("Contraseña"), "password123");
    await userEvent.click(
      screen.getByRole("button", { name: "Iniciar sesión" }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/auth/login");
    expect(JSON.parse(init.body)).toMatchObject({
      email: "ana@example.com",
      password: "password123",
    });

    await waitFor(() => expect(routerPush).toHaveBeenCalledWith("/salas"));
  });

  it("modo login: muestra el error del servidor", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Correo o contraseña incorrectos." }),
    });

    render(<AuthForm mode="login" />);

    await userEvent.type(
      screen.getByLabelText("Correo electrónico"),
      "ana@example.com",
    );
    await userEvent.type(screen.getByLabelText("Contraseña"), "mala");
    await userEvent.click(
      screen.getByRole("button", { name: "Iniciar sesión" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Correo o contraseña incorrectos.",
    );
    expect(routerPush).not.toHaveBeenCalled();
  });

  it("modo register: incluye el campo nombre y usa /api/auth/register", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    render(<AuthForm mode="register" />);

    expect(
      screen.getByRole("heading", { name: "Crear cuenta" }),
    ).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Nombre"), "Ana");
    await userEvent.type(
      screen.getByLabelText("Correo electrónico"),
      "ana@example.com",
    );
    await userEvent.type(
      screen.getByLabelText("Contraseña"),
      "password123",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Crear cuenta" }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0]).toBe("/api/auth/register");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      name: "Ana",
    });

    await waitFor(() => expect(routerPush).toHaveBeenCalledWith("/salas"));
  });
});
