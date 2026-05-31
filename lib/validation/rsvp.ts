import { z } from "zod";

export const rsvpSchema = z.object({
  name: z.string().min(1, "Nama harus diisi").max(120),
  attendance: z.enum(["hadir", "tidak", "ragu"]),
  headcount: z.coerce.number().int().min(1).max(20).default(1),
  message: z.string().max(1000).optional().default(""),
});
export type RsvpInput = z.infer<typeof rsvpSchema>;
