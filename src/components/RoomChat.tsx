"use client";

import { io, type Socket } from "socket.io-client";
import { useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  content: string;
  userId: string;
  createdAt: string;
  user: { id: string; name: string };
};

export default function RoomChat({
  roomId,
  currentUserId,
  initialMessages,
}: {
  roomId: string;
  currentUserId: string;
  initialMessages: Message[];
}) {
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const socket = io({ withCredentials: true });
    socketRef.current = socket;

    socket.emit("room:join", roomId);

    socket.on("message:new", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("connect_error", () => {
      setError("No se pudo conectar. Inicia sesión de nuevo.");
    });

    return () => {
      socket.emit("room:leave", roomId);
      socket.disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [messages.length]);

  function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content) return;

    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      setError("Desconectado. Espera un momento e intenta de nuevo.");
      return;
    }

    socket.emit(
      "message:send",
      { roomId, content },
      (res: { ok: boolean; error?: string }) => {
        if (res?.ok) {
          setDraft("");
          setError(null);
        } else {
          setError(res?.error ?? "No se pudo enviar el mensaje.");
        }
      },
    );
  }

  return (
    <div className="flex h-[calc(100dvh-9rem)] flex-col rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-zinc-400">
            Sin mensajes todavía. ¡Escribe el primero!
          </p>
        )}
        {messages.map((message) => {
          const mine = message.userId === currentUserId;
          return (
            <div
              key={message.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                  mine
                    ? "rounded-br-sm bg-emerald-600 text-white"
                    : "rounded-bl-sm bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white"
                }`}
              >
                {!mine && (
                  <p className="mb-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    {message.user.name}
                  </p>
                )}
                <p className="whitespace-pre-wrap break-words">
                  {message.content}
                </p>
                <p
                  className={`mt-1 text-[10px] ${
                    mine
                      ? "text-emerald-100/80"
                      : "text-zinc-400 dark:text-zinc-500"
                  }`}
                >
                  {new Date(message.createdAt).toLocaleTimeString("es-CL", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSend}
        className="flex items-end gap-2 border-t border-zinc-200 p-3 dark:border-zinc-800"
      >
        <textarea
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          rows={1}
          placeholder="Escribe un mensaje…"
          aria-label="Mensaje"
          className="max-h-32 min-h-[2.5rem] flex-1 resize-y rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Enviar
        </button>
      </form>

      {error && (
        <p
          role="alert"
          className="border-t border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-950/40 dark:bg-red-950/40 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}
