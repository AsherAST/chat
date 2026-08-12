import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(50),
  email: z.string().trim().toLowerCase().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export const createRoomSchema = z.object({
  name: z.string().trim().min(1, "El nombre de la sala es requerido").max(60),
  description: z.string().trim().max(200).optional(),
});

export const messageContentSchema = z
  .string()
  .trim()
  .min(1, "El mensaje no puede estar vacío")
  .max(1000, "El mensaje es demasiado largo");
