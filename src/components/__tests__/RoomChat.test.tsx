import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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

  it("desconecta el socket al desmontar", () => {
    const { unmount } = renderChat();
    unmount();
    expect(socketDisconnect).toHaveBeenCalled();
  });
});
