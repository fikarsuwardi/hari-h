import { z } from "zod";

export const createInvitationSchema = z.object({
  title: z.string().min(1, "Judul undangan harus diisi"),
  slug: z.string().min(3, "Link minimal 3 karakter"),
  themeId: z.string().uuid("Tema tidak valid"),
});
export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
