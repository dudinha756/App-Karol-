import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Informe seu nome."),
  email: z.string().email("E-mail inválido."),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.")
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const profileSchema = z.object({
  age: z.coerce.number().int().min(14).max(100),
  sex: z.enum(["female", "male"]),
  heightCm: z.coerce.number().min(120).max(230),
  weightKg: z.coerce.number().min(30).max(300),
  goal: z.enum(["muscle_gain", "maintain", "fat_loss"]),
  baselineActivity: z.enum(["sedentary", "light", "moderate"])
});
