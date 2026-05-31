import { z } from "zod";

const personSchema = z.object({
  name: z.string().min(1),
  fullName: z.string().nullish(),
  photoUrl: z.string().nullish(),
  parents: z.string().nullish(),
  instagram: z.string().nullish(),
});

const eventSchema = z.object({
  name: z.string().min(1),
  date: z.string().min(1),
  startTime: z.string().nullish(),
  endTime: z.string().nullish(),
  venue: z.string().nullish(),
  address: z.string().nullish(),
  mapsUrl: z
    .string()
    .refine((v) => !v || /^https?:\/\//.test(v), "Link peta harus diawali http(s)://")
    .nullish(),
});

export const invitationDataSchema = z.object({
  couple: z.object({ groom: personSchema, bride: personSchema }),
  events: z.array(eventSchema).default([]),
  quotes: z.object({ text: z.string(), source: z.string().optional() }).nullish(),
  loveStory: z
    .array(z.object({ title: z.string(), date: z.string().optional(), text: z.string() }))
    .nullish(),
  gallery: z.array(z.string()).default([]),
  prewedVideoUrl: z.string().nullish(),
  musicUrl: z
    .string()
    .refine((v) => !v || /^https?:\/\//.test(v), "URL musik harus diawali http(s)://")
    .nullish(),
  livestream: z.object({ platform: z.string(), url: z.string() }).nullish(),
  gift: z
    .array(
      z.object({
        type: z.enum(["bank", "ewallet"]),
        bank: z.string().optional(),
        number: z.string(),
        holder: z.string(),
      }),
    )
    .nullish(),
  settings: z.object({ primaryColor: z.string().optional() }).nullish(),
});
