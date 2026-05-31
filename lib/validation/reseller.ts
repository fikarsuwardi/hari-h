import { z } from "zod";
export const applyResellerSchema = z.object({
  // Tidak ada field user wajib selain persetujuan; sediakan placeholder bila perlu.
  agree: z.literal("on", { message: "Anda harus menyetujui ketentuan." }),
});
