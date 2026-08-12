import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RoomChat from "@/components/RoomChat";

const { socketOn, socketEmit, socketDisconnect, ioMock } = vi.hoisted(
  () => ({
    socketOn: vi.fn(),
    socketEmit: vi.fn(),
    socketDisconnect: vi.fn(),
    ioMock: vi.fn(),
  }),
);

const fakeSocket = {
  on: socketOn,
  emit: socketEmit,
  disconnect: socketDisconnect,
  connected: true,
};

vi.mock("socket.io-client", () => ({
  io: (...args: unknown[]) => {
    ioMock(...args);
    return fakeSocket;
  },
}));

const initialMessages = [
  {
    id: "m1",
    content: "Hola",
    userId: "u-other",
    createdAt: "2026-08-12T10:00:00.000Z",
    user: { id: "u-other", name: "Ana" },
  },
];

function renderChat() {
  return render(
    <RoomChat
      roomId="r1"
      currentUserId="u-me"
      initialMessages={initialMessages}
    />,
  );
}

function emitNewMessage() {
  const call = socketOn.mock.calls.find(([event]) => event === "message:new");
  expect(call).toBeTruthy();
  const [, handler] = call as [string, (message: Record<string, unknown>) => void];
  handler({
    id: "m2",
    content: "Nuevo mensaje",
    userId: "u-other",
    createdAt: "2026-08-12T10:01:00.000Z",
    user: { id: "u-other", name: "Ana" },
  });
}

function emitPresence(users: Array<{ id: string; name: string }>) {
  const call = socketOn.mock.calls.find(
    ([event]) => event === "presence:update",
  );
  expect(call).toBeTruthy();
  const [, handler] = call as [
    string,
    (users: Array<{ id: string; name: string }>) => void,
  ];
  act(() => handler(users));
}

function emitTypingStart() {
  const call = socketOn.mock.calls.find(([event]) => event === "typing:start");
  expect(call).toBeTruthy();
  const [, handler] = call as [
    string,
    (data: { userId: string; name: string }) => void,
  ];
  act(() => handler({ userId: "u-other", name: "Ana" }));
}

function emitTypingStop() {
  const call = socketOn.mock.calls.find(([event]) => event === "typing:stop");
  expect(call).toBeTruthy();
  const [, handler] = call as [string, (data: { userId: string }) => void];
  act(() => handler({ userId: "u-other" }));
}

describe("RoomChat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("se conecta al socket, entra a la sala y muestra el historial", () => {
    renderChat();

    expect(ioMock).toHaveBeenCalledWith({ withCredentials: true });
    expect(socketOn).toHaveBeenCalledWith(
      "message:new",
      expect.any(Function),
    );
    expect(socketOn).toHaveBeenCalledWith(
      "presence:update",
      expect.any(Function),
    );
    expect(socketEmit).toHaveBeenCalledWith("room:join", "r1");
    expect(screen.getByText("Hola")).toBeInTheDocument();
    expect(screen.getByText("Ana")).toBeInTheDocument();
  });

  it("recibe mensajes nuevos en tiempo real", async () => {
    renderChat();
    emitNewMessage();
    expect(await screen.findByText("Nuevo mensaje")).toBeInTheDocument();
  });

  it("envía un mensaje y limpia el campo", async () => {
    renderChat();
    socketEmit.mockImplementation(
      (_event: string, _data: unknown, ack?: (r: { ok: boolean }) => void) => {
        ack?.({ ok: true });
      },
    );

    const input = screen.getByLabelText("Mensaje");
    await userEvent.type(input, "Hola a todos");
    await userEvent.click(screen.getByRole("button", { name: "Enviar" }));

    await waitFor(() => {
      expect(socketEmit).toHaveBeenCalledWith(
        "message:send",
        { roomId: "r1", content: "Hola a todos" },
        expect.any(Function),
      );
    });
    expect(input).toHaveValue("");
  });

  it("muestra la lista de usuarios en línea y el conteo", () => {
    renderChat();
    emitPresence([
      { id: "u-me", name: "Yo" },
      { id: "u-other", name: "Ana" },
    ]);
    expect(screen.getByText("2 en línea")).toBeInTheDocument();
    expect(screen.getByText("Y")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("muestra y oculta el indicador de escritura", () => {
    renderChat();
    emitTypingStart();
    expect(
      screen.getByText((content) => content.includes("escribiendo")),
    ).toBeInTheDocument();
    expect(screen.getByText("Ana")).toBeInTheDocument();
    emitTypingStop();
    expect(
      screen.queryByText((content) => content.includes("escribiendo")),
    ).not.toBeInTheDocument();
  });

  it("emite typing:start al escribir y typing:stop al enviar", async () => {
    socketEmit.mockImplementation(
      (_event: string, _data: unknown, ack?: (r: { ok: boolean }) => void) => {
        ack?.({ ok: true });
      },
    );
    renderChat();

    const input = screen.getByLabelText("Mensaje");
    await userEvent.type(input, "Hol");

    expect(socketEmit).toHaveBeenCalledWith("typing:start", "r1");

    await userEvent.type(input, "a a todos");
    await userEvent.click(screen.getByRole("button", { name: "Enviar" }));

    expect(socketEmit).toHaveBeenCalledWith("typing:stop", "r1");
    expect(input).toHaveValue("");
  });

  it("emite typing:stop al desmontar", () => {
    const { unmount } = renderChat();
    unmount();
    expect(socketEmit).toHaveBeenCalledWith("typing:stop", "r1");
  });

  it("desconecta el socket al desmontar", () => {
    const { unmount } = renderChat();
    unmount();
    expect(socketDisconnect).toHaveBeenCalled();
  });
});
