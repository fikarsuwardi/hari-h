import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
});

export const registerSchema = loginSchema.extend({
  fullName: z.string().min(1, "Nama lengkap harus diisi"),
  phone: z.string().min(8, "No WhatsApp harus diisi"),
});

export const resetSchema = z.object({
  email: z.string().email("Email tidak valid"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
