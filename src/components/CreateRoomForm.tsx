"use client";

import { useState } from "react";
import { createRoomAction } from "@/app/actions/rooms";

export default function CreateRoomForm() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
      >
        + Nueva sala
      </button>
    );
  }

  return (
    <form
      action={createRoomAction}
      className="w-full rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:max-w-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="space-y-3">
        <div>
          <label
            htmlFor="room-name"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Nombre de la sala
          </label>
          <input
            id="room-name"
            name="name"
            type="text"
            required
            maxLength={60}
            placeholder="p. ej. Backend"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
          />
        </div>
        <div>
          <label
            htmlFor="room-description"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Descripción (opcional)
          </label>
          <input
            id="room-description"
            name="description"
            type="text"
            maxLength={200}
            placeholder="¿De qué se habla aquí?"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Crear
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300"
          >
            Cancelar
          </button>
        </div>
      </div>
    </form>
  );
}
